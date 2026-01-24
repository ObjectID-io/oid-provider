import { getFullnodeUrl, IotaClient, type IotaObjectData } from "@iota/iota-sdk/client";

import { createObjectIdApi, type ObjectIdApi } from "../api";
import { loadPublicConfig, loadConfigJsonByObjectId, type LoadedConfig } from "../onchain/config";
import type { ObjectIdProviderConfig, ObjectEdge, TxExecResult } from "../types/types";
import { getObject as getObjectRpc } from "../utils/getObject";

import { normalizeHex, pickCapMatchingDid } from "./caps";
import { extractBalance } from "./credit";
import { graphqlAllByType, graphqlAllByTypeAndOwner } from "./graphql";
import { getOwnedObjectIdsByType } from "./ownedObjects";

/**
 * Session state exposed by the high-level OID wrapper.
 * Values are resolved in `oid.connect(...)`.
 */
export type OidSession = {
  initialized: boolean;

  network: string;
  did: string;
  seed: string;
  seedPath?: string;

  address: string;
  graphqlProvider: string;

  /** Active config JSON (effective runtime config) */
  configJson: Record<string, any>;
  /** If config was loaded from an on-chain Config object, its objectId */
  configObjectId?: string;
  /** Last loaded public config */
  publicConfig?: LoadedConfig;

  /** IOTA Identity ControllerCap objectId matching `did` (deterministic via controller_of) */
  identityControllerCap?: string;
  /** OID Identity ControllerCap objectId matching `did` (deterministic via controller_of) */
  oidControllerCap?: string;

  /** Owned credit token objectIds */
  creditTokens: string[];
  /** Currently selected credit token objectId */
  activeCreditToken?: string;
};

export type ConnectParams = {
  did: string;
  seed: string;
  /** Optional, defaults to current provider config network (or "testnet") */
  network?: string;
  /** Optional derivation path for deterministic key selection */
  seedPath?: string;
};

type ProviderState = {
  network: string;
  configJson: Record<string, any>;
  source: "public" | "manual" | "object";
  configObjectId?: string;
  publicConfig?: LoadedConfig;
};

function notInitialized(): never {
  throw new Error("not initialized");
}

export type Oid = ObjectIdApi & {
  /** Provider-level config (readable even without a session).
   *
   * - oid.config()                     -> returns effective provider config JSON (loads from chain if missing)
   * - oid.config(network)              -> loads provider config JSON for network from chain
   * - oid.config(json)                 -> sets provider config JSON manually (kept in memory)
   * - oid.config({ network, json })    -> sets manual provider config JSON + network
   */
  config: (
    arg?:
      | string
      | Record<string, any>
      | {
          network?: string;
          json: Record<string, any>;
        }
  ) => Promise<Record<string, any>>;

  /** Initializes a session (tx signing). */
  connect: (p: ConnectParams) => Promise<void>;

  /** Resets session state (no-op if already disconnected). */
  disconnect: () => void;

  /** Current session snapshot (requires connect). */
  session: {
    readonly network: string;
    readonly did: string;
    readonly address: string;

    readonly oidControllerCap?: string;
    readonly identityControllerCap?: string;

    readonly creditTokens: string[];
    creditToken: (id?: string) => string | undefined;

    /** Returns remaining credit for the active credit token (best-effort). */
    credit: () => Promise<string | null>;

    /** Subscribe to tx execution completion (success OR failure). Useful to refresh credits deterministically. */
    onCreditChanged: (cb: (r: TxExecResult) => void) => () => void;

    /** Returns the current session details (effective config + resolved capabilities). */
    config: () => OidSession;

    /** Exposes raw resolved session for debugging (same as config()). */
    raw: () => OidSession;
  };

  /** Methods usable without initialization. */
  getObject: (id: string, network: string) => Promise<IotaObjectData | null>;
  getObjectsByType: (type: string, network: string) => Promise<ObjectEdge[]>;
  getObjectsByTypeAndOwner: (type: string, owner: string, network: string) => Promise<ObjectEdge[]>;
};

/**
 * Creates a high-level wrapper around the generated ObjectId API.
 * - Read-only methods work without a session.
 * - Tx methods require `oid.connect(...)`.
 */
export function createOid(): Oid {
  let api: ObjectIdApi | null = null;
  let s: OidSession | null = null;
  let provider: ProviderState | null = null;

  // Credit change listeners (hint-based, deterministic on tx execution completion).
  const creditListeners = new Set<(r: TxExecResult) => void>();
  const emitCreditChanged = (r: TxExecResult) => {
    for (const cb of creditListeners) {
      try {
        cb(r);
      } catch {
        /* ignore listener errors */
      }
    }
  };

  const ensureSession = (): { api: ObjectIdApi; s: OidSession } => {
    if (!api || !s || !s.initialized) notInitialized();
    return { api, s };
  };

  const normalizeProviderNetwork = (network?: string): string => {
    const n = String(network ?? provider?.network ?? "testnet").trim();
    return n || "testnet";
  };

  const ensureProvider = async (network?: string): Promise<ProviderState> => {
    const net = normalizeProviderNetwork(network);

    // keep manual config if network matches
    if (provider && provider.network === net && provider.configJson) return provider;

    const loaded = await loadPublicConfig(net as any);
    provider = {
      network: net,
      configJson: loaded.json ?? {},
      source: "public",
      configObjectId: loaded.objectId,
      publicConfig: loaded,
    };
    return provider;
  };

  const applyConfigJsonForSession = async (
    did: string,
    seed: string,
    seedPath: string | undefined,
    network: string,
    cfgJson: Record<string, any>,
    configObjectId?: string,
    publicConfig?: LoadedConfig
  ) => {
    const merged: ObjectIdProviderConfig = {
      ...(cfgJson as any),
      network,
      seed,
      seedPath,
    };

    api = createObjectIdApi(merged);
    // Hook: called after every signAndExecute attempt (success OR failure)
    (api as any).onTxExecuted = (r: TxExecResult) => emitCreditChanged(r);

    const env = await api.env();
    const client = env.client;
    const address = env.sender;
    const graphqlProvider = env.graphqlProvider;

    // STRICT: only canonical keys are accepted; missing values are fatal.
    const cfgAny = cfgJson as any;

    const iotaIdentityPackage = normalizeHex(String(cfgAny.IOTAidentityPackage ?? ""));
    const oidIdentityPackage = normalizeHex(String(cfgAny.OIDidentityPackage ?? ""));

    if (!iotaIdentityPackage) throw new Error("Missing IOTAidentityPackage in config JSON");
    if (!oidIdentityPackage) throw new Error("Missing OIDidentityPackage in config JSON");

    const identityCapType = `${iotaIdentityPackage}::controller::ControllerCap`;
    const oidCapType = `${oidIdentityPackage}::oid_identity::ControllerCap`;

    const [identityCapIds, oidCapIds] = await Promise.all([
      getOwnedObjectIdsByType(client, address, identityCapType),
      getOwnedObjectIdsByType(client, address, oidCapType),
    ]);

    const [identityControllerCap, oidControllerCap] = await Promise.all([
      pickCapMatchingDid(client, identityCapIds, did),
      pickCapMatchingDid(client, oidCapIds, did),
    ]);

    if (!identityControllerCap) throw new Error("IOTA Identity ControllerCap not found for the provided DID");
    if (!oidControllerCap) throw new Error("OID Identity ControllerCap not found for the provided DID");

    const creditTokenType = `0x2::token::Token<${env.packageID}::oid_credit::OID_CREDIT>`;
    const creditTokens = await getOwnedObjectIdsByType(client, address, creditTokenType);
    if (!creditTokens.length) throw new Error("No credit tokens found for this address");

    s = {
      initialized: true,
      network,
      did,
      seed,
      seedPath,
      address,
      graphqlProvider,
      configJson: cfgJson,
      configObjectId,
      publicConfig,

      identityControllerCap,
      oidControllerCap,

      creditTokens,
      activeCreditToken: creditTokens[0],
    };
  };

  const config: Oid["config"] = async (arg?: any) => {
    // getter: returns effective provider config JSON
    if (arg === undefined) {
      const p = await ensureProvider();
      return p.configJson;
    }

    // load from chain by network
    if (typeof arg === "string") {
      const p = await ensureProvider(arg);
      return p.configJson;
    }

    // set manual provider config
    if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) {
      // on-chain object form: { network?, objectId }
      if (typeof (arg as any).objectId === "string" && String((arg as any).objectId).trim()) {
        const net = normalizeProviderNetwork((arg as any).network);
        const objectId = String((arg as any).objectId).trim();
        const json = await loadConfigJsonByObjectId(net as any, objectId);
        provider = {
          network: net,
          configJson: json ?? {},
          source: "public",
          configObjectId: objectId,
          publicConfig: undefined,
        };
        return provider.configJson;
      }

      // wrapper form: { network?, json }
      if (Object.prototype.hasOwnProperty.call(arg, "json")) {
        const net = normalizeProviderNetwork(arg.network);
        const json = (arg.json ?? {}) as Record<string, any>;
        provider = {
          network: net,
          configJson: json,
          source: "manual",
        };
        return provider.configJson;
      }

      // raw json form
      const net = normalizeProviderNetwork();
      provider = {
        network: net,
        configJson: arg as Record<string, any>,
        source: "manual",
      };
      return provider.configJson;
    }

    throw new Error("Invalid config argument");
  };

  const connect: Oid["connect"] = async (p: ConnectParams) => {
    const did = String(p?.did ?? "").trim();
    const seed = String(p?.seed ?? "").trim();
    const seedPath = String(p?.seedPath ?? "").trim() || undefined;
    if (!did) throw new Error("DID is required.");
    if (!seed) throw new Error("Seed is required.");

    const net = normalizeProviderNetwork(p.network);

    // Ensure provider config exists for this network (chain default unless manually set).
    const prov = await ensureProvider(net);

    await applyConfigJsonForSession(did, seed, seedPath, net, prov.configJson, prov.configObjectId, prov.publicConfig);
  };

  const disconnect: Oid["disconnect"] = () => {
    api = null;
    s = null;
    // keep provider config; only session is cleared
    creditListeners.clear();
  };

  const sessionObj: Oid["session"] = {
    get network() {
      return ensureSession().s.network;
    },
    get did() {
      return ensureSession().s.did;
    },
    get address() {
      return ensureSession().s.address;
    },
    get oidControllerCap() {
      return ensureSession().s.oidControllerCap;
    },
    get identityControllerCap() {
      return ensureSession().s.identityControllerCap;
    },
    get creditTokens() {
      return ensureSession().s.creditTokens;
    },
    creditToken(id?: string) {
      const { s } = ensureSession();
      if (id === undefined) return s.activeCreditToken;
      const t = id.trim();
      if (!t) throw new Error("creditToken id is required");
      if (!s.creditTokens.includes(t)) throw new Error("creditToken not owned by the current address");
      s.activeCreditToken = t;
      return s.activeCreditToken;
    },
    onCreditChanged(cb: (r: TxExecResult) => void) {
      creditListeners.add(cb);
      return () => creditListeners.delete(cb);
    },
    async credit() {
      const { api, s } = ensureSession();
      const tokenId = s.activeCreditToken;
      if (!tokenId) return null;
      const env = await api.env();
      const obj = await getObjectRpc(env.client, tokenId);
      return extractBalance((obj as any) ?? null);
    },
    config() {
      return ensureSession().s;
    },
    raw() {
      return ensureSession().s;
    },
  };

  const base: any = {
    config,
    connect,
    disconnect,
    session: sessionObj,

    // uninitialized-safe methods
    async getObject(id: string, network: string) {
      const client = new IotaClient({ url: getFullnodeUrl(network as any) });
      const obj = await getObjectRpc(client, id);
      return (obj as any) ?? null;
    },

    async getObjectsByType(type: string, network: string) {
      const p = await ensureProvider(network);
      const graphqlProvider = String((p.configJson as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in provider config");
      return await graphqlAllByType(graphqlProvider, type);
    },

    async getObjectsByTypeAndOwner(type: string, owner: string, network: string) {
      const p = await ensureProvider(network);
      const graphqlProvider = String((p.configJson as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in provider config");
      return await graphqlAllByTypeAndOwner(graphqlProvider, type, owner);
    },
  };

  // Proxy to forward ALL existing API methods once connected, otherwise throw "not initialized"
  return new Proxy(base, {
    get(_target, prop: string | symbol) {
      // expose our own fields
      if (prop in base) return base[prop as any];

      // allow inspection
      if (prop === "toJSON")
        return () => ({
          connected: !!s?.initialized,
          network: s?.network ?? provider?.network,
          address: s?.address,
        });

      // if connected and api has property, return it
      if (api && (api as any)[prop] !== undefined) {
        const v = (api as any)[prop];
        return typeof v === "function" ? v.bind(api) : v;
      }

      // provide a nice error for accidental config-object-id loading attempt
      if (prop === "loadConfigJsonByObjectId") {
        return async (network: string, objectId: string) => {
          return await loadConfigJsonByObjectId(network as any, objectId);
        };
      }

      // otherwise return a function that throws (so calls fail with required message)
      return () => notInitialized();
    },
  }) as unknown as Oid;
}
