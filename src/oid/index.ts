// src/oid/index.ts
import { getFullnodeUrl, IotaClient, type IotaObjectData } from "@iota/iota-sdk/client";

import { createObjectIdApi, type ObjectIdApi } from "../api";
import { loadPublicConfig, loadConfigJsonByObjectId, type LoadedConfig } from "../onchain/config";
import type { Network, ObjectIdProviderConfig, ObjectEdge, TxExecResult } from "../types/types";
import { getObject as getObjectRpc } from "../utils/getObject";

import { normalizeHex, pickCapMatchingDid } from "./caps";
import { extractBalance } from "./credit";
import { graphqlAllByType, graphqlAllByTypeAndOwner } from "./graphql";
import { getOwnedObjectIdsByType } from "./ownedObjects";

/**
 * Session state exposed by the high-level OID wrapper.
 * Values are resolved in `oid.config(...)`.
 */
export type OidSession = {
  initialized: boolean;

  network: Network;
  did: string;
  seed: string;

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

type OidConfigParams = { did: string; seed: string; network: Network };

function notInitialized(): never {
  throw new Error("not initialized");
}

export type Oid = ObjectIdApi & {
  /** Initializes the provider. Required before calling tx methods. */
  config: {
    (did: string, seed: string, network: Network): Promise<void>;
    (network?: Network): Promise<Record<string, any>>;
  };
  publicConfig: (network?: Network) => Promise<Record<string, any>>;
  configParams: (p: OidConfigParams) => Promise<void>;

  /** Current session snapshot (read-only object, but may contain callable helpers) */
  session: {
    readonly network: Network;
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

    /** Gets or sets active config. No arg => current JSON. Object => set JSON. String => load from on-chain objectId. */
    config: (arg?: Record<string, any> | string) => Promise<Record<string, any>>;

    /** Exposes raw resolved session for debugging */
    raw: () => OidSession;
  };

  /** Methods usable without initialization. */
  getObject: (id: string, network: Network) => Promise<IotaObjectData | null>;
  getObjectsByType: (type: string, network: Network) => Promise<ObjectEdge[]>;
  getObjectsByTypeAndOwner: (type: string, owner: string, network: Network) => Promise<ObjectEdge[]>;
};

/**
 * Creates a high-level wrapper around the generated ObjectId API.
 * Before calling tx methods you MUST call `oid.config(...)`.
 */
export function createOid(): Oid {
  let api: ObjectIdApi | null = null;
  let s: OidSession | null = null;

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

  const ensure = (): { api: ObjectIdApi; s: OidSession } => {
    if (!api || !s || !s.initialized) notInitialized();
    return { api, s };
  };

  const applyConfigJson = async (
    seed: string,
    did: string,
    network: Network,
    cfgJson: Record<string, any>,
    configObjectId?: string,
    publicConfig?: LoadedConfig,
  ) => {
    const merged: ObjectIdProviderConfig = {
      ...(cfgJson as any),
      network,
      seed,
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

  const configParams = async (p: OidConfigParams) => {
    const did = (p.did ?? "").trim();
    const seed = (p.seed ?? "").trim();
    const network = p.network;

    if (!did) throw new Error("DID is required.");
    if (!seed) throw new Error("Seed is required.");
    if (!network) throw new Error("Network is required.");

    const publicCfg = await loadPublicConfig(network);
    const cfgJson = publicCfg.json ?? {};
    await applyConfigJson(seed, did, network, cfgJson, undefined, publicCfg);
  };

  const config = async (...args: any[]): Promise<any> => {
    // Overload:
    // - config(did, seed, network) -> initialize session (tx signing)
    // - config(network?)          -> return PUBLIC config JSON (no session required)
    if (args.length === 3) {
      const [did, seed, network] = args as [string, string, Network];
      await configParams({ did, seed, network });
      return;
    }

    const [network] = args as [Network?];
    const net: Network = (network ?? "testnet") as Network;
    const cfg = await loadPublicConfig(net);
    return cfg.json;
  };

  // Alias (more explicit): read public config without session
  const publicConfig = async (network: Network = "testnet") => {
    const cfg = await loadPublicConfig(network);
    return cfg.json;
  };

  const sessionObj: Oid["session"] = {
    get network() {
      return ensure().s.network;
    },
    get did() {
      return ensure().s.did;
    },
    get address() {
      return ensure().s.address;
    },
    get oidControllerCap() {
      return ensure().s.oidControllerCap;
    },
    get identityControllerCap() {
      return ensure().s.identityControllerCap;
    },
    get creditTokens() {
      return ensure().s.creditTokens;
    },
    creditToken(id?: string) {
      const { s } = ensure();
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
      const { api, s } = ensure();
      const tokenId = s.activeCreditToken;
      if (!tokenId) return null;
      const env = await api.env();
      const obj = await getObjectRpc(env.client, tokenId);
      return extractBalance((obj as any) ?? null);
    },
    async config(arg?: Record<string, any> | string) {
      const { s } = ensure();

      if (arg === undefined) return s.configJson;

      // set by JSON
      if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) {
        const nextJson = arg as Record<string, any>;
        await applyConfigJson(s.seed, s.did, s.network, nextJson, undefined, s.publicConfig);
        return ensure().s.configJson;
      }

      // set by objectId
      if (typeof arg === "string") {
        const objectId = arg.trim();
        if (!objectId) throw new Error("config objectId is required");
        const json = await loadConfigJsonByObjectId(s.network as any, objectId);
        await applyConfigJson(s.seed, s.did, s.network, json, objectId, s.publicConfig);
        return ensure().s.configJson;
      }

      throw new Error("Invalid config argument");
    },
    raw() {
      return ensure().s;
    },
  };

  const base: any = {
    config,
    publicConfig,
    configParams,
    session: sessionObj,

    // uninitialized-safe methods
    async getObject(id: string, network: Network) {
      const client = new IotaClient({ url: getFullnodeUrl(network as any) });
      const obj = await getObjectRpc(client, id);
      return (obj as any) ?? null;
    },

    async getObjectsByType(type: string, network: Network) {
      const publicCfg = await loadPublicConfig(network);
      const graphqlProvider = String((publicCfg.json as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in public config");
      return await graphqlAllByType(graphqlProvider, type);
    },

    async getObjectsByTypeAndOwner(type: string, owner: string, network: Network) {
      const publicCfg = await loadPublicConfig(network);
      const graphqlProvider = String((publicCfg.json as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in public config");
      return await graphqlAllByTypeAndOwner(graphqlProvider, type, owner);
    },
  };

  // Proxy to forward ALL existing API methods once initialized, otherwise throw "not initialized"
  return new Proxy(base, {
    get(_target, prop: string | symbol) {
      // expose our own fields
      if (prop in base) return base[prop as any];

      // allow inspection
      if (prop === "toJSON") return () => ({ initialized: !!s?.initialized, network: s?.network, address: s?.address });

      // if initialized and api has property, return it
      if (api && (api as any)[prop] !== undefined) {
        const v = (api as any)[prop];
        return typeof v === "function" ? v.bind(api) : v;
      }

      // otherwise return a function that throws (so calls fail with required message)
      return () => notInitialized();
    },
  }) as unknown as Oid;
}
