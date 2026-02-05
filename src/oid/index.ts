import { getFullnodeUrl, IotaClient, type IotaObjectData } from "@iota/iota-sdk/client";

import { createObjectIdApi, type ObjectIdApi } from "../api";
import { loadPublicConfig, type LoadedConfig } from "../onchain/config";
import { getObjectIdsByType } from "../onchain/getObjects";
import type { ObjectIdProviderConfig, ObjectEdge, TxExecResult } from "../types/types";
import { getObject, getObject as getObjectRpc } from "../utils/getObject";

import { normalizeHex, pickCapMatchingDid } from "./caps";
import { extractBalance } from "./credit";
import { graphqlAllByType, graphqlAllByTypeAndOwner } from "./graphql";
import { getOwnedObjectIdsByType } from "./ownedObjects";

/**
 * Session state exposed by the high-level OID wrapper.
 * Values are resolved in `oid.connect(...)` and can be changed via `oid.setSession(...)`.
 */
export type Network = "testnet" | "mainnet" | (string & {});

export type OidSession = {
  initialized: boolean;

  network: Network;
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

  identityControllerCap?: string;
  oidControllerCap?: string;

  /** True if the user owns an OID ControllerCap matching the provided DID (i.e., identity is linked / DLVC). */
  identityIsLinked: boolean;

  creditTokens: string[];
  activeCreditToken?: string;
};

export type ConnectParams = {
  did: string;
  seed: string;
  /**
   * Used ONLY to choose which chain to read the pinned public config from when bootstrapping.
   * The session network is still derived from configJSON.network (see setSession).
   */
  network?: Network;
  seedPath?: string;
};

function notInitialized(): never {
  throw new Error("not initialized");
}

/** Loose network normalization (for selecting a chain to READ public config from). */
function normalizeNetworkLoose(network?: string): "testnet" | "mainnet" {
  const n = String(network ?? "")
    .toLowerCase()
    .trim();
  if (n === "mainnet" || n === "iota") return "mainnet";
  return "testnet";
}

/** Strict network read (for setting session network from config JSON). */
function readNetworkFromConfigJson(cfg: any): "testnet" | "mainnet" {
  const n = String(cfg?.network ?? "")
    .toLowerCase()
    .trim();
  if (n === "mainnet" || n === "iota") return "mainnet";
  if (n === "testnet") return "testnet";
  throw new Error("configJSON.network must be 'testnet' or 'mainnet'");
}

function tryReadNetworkFromConfigJson(cfg: any): "testnet" | "mainnet" | null {
  try {
    return readNetworkFromConfigJson(cfg);
  } catch {
    return null;
  }
}

function extractOfficialPackages(json: Record<string, any>): string[] {
  const raw =
    (json as any)?.officialPackages ?? (json as any)?.official_packages ?? (json as any)?.official_packages_ids ?? [];
  const arr = Array.isArray(raw) ? raw : [];
  const out = arr.map((x) => normalizeHex(String(x ?? "").trim())).filter((x) => !!x);
  return Array.from(new Set(out));
}

export type Oid = ObjectIdApi & {
  /** Reset session state (no-op if already disconnected). */
  disconnect: () => void;

  /** Init session (tx signing). */
  connect: (p: ConnectParams) => Promise<void>;

  /**
   * Set the *effective* runtime configuration for the current session.
   * The session network is derived from configJSON.network.
   */
  setSession: (configJSON: Record<string, any>) => Promise<void>;

  /** Request free credits (testnet only; requires an active session). */
  faucet: () => Promise<string>;

  /** Read ONLY the official allow-list from on-chain public config. Works without session. */
  officialPackages: (network?: string) => Promise<string[]>;

  /**
   * TokenPolicy object id required by Move calls.
   * Alias for: `(await oid.env()).policy`.
   *
   * Requires an active session (connect + setSession already applied by connect).
   */
  readonly policyToken: Promise<string>;

  /** Session accessors */
  session: {
    readonly network: Network;
    readonly did: string;
    readonly address: string;

    /** True if the user owns an OID ControllerCap matching the provided DID (linked identity / DLVC). */
    readonly identityIsLinked: boolean;

    readonly oidControllerCap?: string;
    readonly identityControllerCap?: string;

    readonly creditTokens: string[];
    creditToken: (id?: string) => string | undefined;

    credit: () => Promise<string | null>;
    onCreditChanged: (cb: (r: TxExecResult) => void) => () => void;

    /**
     * Read-only.
     * - If session is active: returns the config in use.
     * - If no session: returns the pinned public default config for the indicated network (default: testnet).
     */
    config: (network?: string) => Promise<Record<string, any>>;

    /** Session snapshot (requires connect). */
    raw: () => OidSession;
  };

  /** Methods usable without initialization. */
  getObject: (id: string, network: string) => Promise<IotaObjectData | null>;
  getObjectsByType: (type: string, network: string) => Promise<ObjectEdge[]>;
  getObjectsByTypeAndOwner: (type: string, owner: string, network: string) => Promise<ObjectEdge[]>;
};

export function createOid(): Oid {
  let api: ObjectIdApi | null = null;
  let s: OidSession | null = null;

  // Credit change listeners
  const creditListeners = new Set<(r: TxExecResult) => void>();
  const emitCreditChanged = (r: TxExecResult) => {
    for (const cb of creditListeners) {
      try {
        cb(r);
      } catch {
        /* ignore */
      }
    }
  };

  const ensureSession = (): { api: ObjectIdApi; s: OidSession } => {
    if (!api || !s || !s.initialized) notInitialized();
    return { api, s };
  };

  const loadDefaultPublicConfigJson = async (network?: string) => {
    const net = normalizeNetworkLoose(network ?? "testnet");
    const loaded = await loadPublicConfig(net as any);
    return { net, loaded, json: (loaded.json ?? {}) as Record<string, any> };
  };

  const officialPackages: Oid["officialPackages"] = async (network?: string) => {
    const { json } = await loadDefaultPublicConfigJson(network);
    return extractOfficialPackages(json);
  };

  // ---- helpers: credit token type + refresh ----
  const getCreditTypeArgFromCfg = (cfgAny: any) => {
    const pkg = normalizeHex(String(cfgAny?.OIDcreditPackage ?? cfgAny?.oidCreditPackage ?? "").trim());
    if (!pkg) throw new Error("Missing OIDcreditPackage in config JSON");
    return `${pkg}::oid_credit::OID_CREDIT`;
  };

  const getCreditTokenStructTypeFromCfg = (cfgAny: any) => {
    const creditTypeArg = getCreditTypeArgFromCfg(cfgAny);
    return `0x2::token::Token<${creditTypeArg}>`;
  };

  const refreshSessionCreditTokens = async (client: IotaClient, cfgAny: any) => {
    if (!s?.initialized) return [];
    const creditTokenType = getCreditTokenStructTypeFromCfg(cfgAny);
    const tokens = await getOwnedObjectIdsByType(client, s.address, creditTokenType);

    s.creditTokens = tokens;
    if (!s.activeCreditToken || !tokens.includes(s.activeCreditToken)) {
      s.activeCreditToken = tokens[0];
    }
    return tokens;
  };

  const applyConfigJsonForSession = async (
    did: string,
    seed: string,
    seedPath: string | undefined,
    network: Network,
    cfgJson: Record<string, any>,
    configObjectId?: string,
    publicConfig?: LoadedConfig,
  ) => {
    const merged: ObjectIdProviderConfig = {
      ...(cfgJson as any),
      network,
      seed,
      seedPath,
    };

    api = createObjectIdApi(merged);
    (api as any).onTxExecuted = (r: TxExecResult) => emitCreditChanged(r);

    const env = await api.env();
    const client = env.client;
    const address = env.sender;
    const graphqlProvider = env.graphqlProvider;

    const cfgAny = cfgJson as any;

    const iotaIdentityPackage = normalizeHex(String(cfgAny.IOTAidentityPackage ?? ""));
    const oidIdentityPackage = normalizeHex(String(cfgAny.OIDidentityPackage ?? ""));

    if (!iotaIdentityPackage) throw new Error("Missing IOTAidentityPackage in config JSON");
    if (!oidIdentityPackage) throw new Error("Missing OIDidentityPackage in config JSON");

    const identityCapType = `${iotaIdentityPackage}::controller::ControllerCap`;
    const oidCapType = `${oidIdentityPackage}::oid_identity::ControllerCap`;

    const identityCapIds = await getOwnedObjectIdsByType(client, address, identityCapType);
    const identityControllerCap = await pickCapMatchingDid(client, identityCapIds, did);
    if (!identityControllerCap) throw new Error("IOTA Identity ControllerCap not found for the provided DID");

    // OID Identity ControllerCap is OPTIONAL.
    const didId = (() => {
      const ss = String(did ?? "").trim();
      const last = ss.split(":").pop() ?? "";
      const ok = last && /^(0x)?[0-9a-fA-F]+$/.test(last);
      return ok ? normalizeHex(last) : "";
    })();

    let oidControllerCap: string | undefined;
    let identityIsLinked = false;

    // RPC-only: scan owned ControllerCap objects and match fields.controller_of == didId
    if (didId) {
      try {
        const oidCapIds = await getObjectIdsByType(client, address, oidCapType);

        const matches: Array<{ id: string; version: bigint }> = [];

        for (const id of oidCapIds) {
          const obj: any = await getObject(client, id);
          if (!obj) continue;

          const fields =
            (obj as any)?.content?.fields ??
            (obj as any)?.content?.data?.fields ??
            (obj as any)?.data?.content?.fields ??
            (obj as any)?.data?.content?.data?.fields ??
            {};

          const controllerOf = normalizeHex(String(fields?.controller_of ?? ""));
          if (!controllerOf || controllerOf !== didId) continue;

          const vRaw = (obj as any)?.version;
          let v = 0n;
          try {
            if (typeof vRaw === "string" && vRaw) v = BigInt(vRaw);
            else if (typeof vRaw === "number") v = BigInt(vRaw);
          } catch {
            v = 0n;
          }

          matches.push({ id, version: v });
        }

        if (matches.length > 0) {
          matches.sort((a, b) => (a.version === b.version ? a.id.localeCompare(b.id) : a.version > b.version ? -1 : 1));
          oidControllerCap = matches[0].id;
          identityIsLinked = true;
        }
      } catch {
        // ok: remains false
      }
    }

    const creditTokenType = getCreditTokenStructTypeFromCfg(cfgAny);
    const creditTokens = await getOwnedObjectIdsByType(client, address, creditTokenType);

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

      identityIsLinked,

      creditTokens,
      activeCreditToken: creditTokens[0],
    };
  };

  // --- NEW API: setSession(configJSON) ---
  const setSession: Oid["setSession"] = async (configJSON: Record<string, any>) => {
    const { s: cur } = ensureSession();

    if (!configJSON || typeof configJSON !== "object" || Array.isArray(configJSON)) {
      throw new Error("configJSON must be an object");
    }

    const net = readNetworkFromConfigJson(configJSON);

    await applyConfigJsonForSession(cur.did, cur.seed, cur.seedPath, net, configJSON);
  };

  // --- Read-only session.config(network?) ---
  const sessionConfig: Oid["session"]["config"] = async (network?: string) => {
    if (s?.initialized) return s.configJson;

    const { json } = await loadDefaultPublicConfigJson(network ?? "testnet");
    return json;
  };

  const connect: Oid["connect"] = async (p: ConnectParams) => {
    const did = String(p?.did ?? "").trim();
    const seed = String(p?.seed ?? "").trim();
    const seedPath = String(p?.seedPath ?? "").trim() || undefined;
    if (!did) throw new Error("DID is required.");
    if (!seed) throw new Error("Seed is required.");

    // Bootstrapping: read pinned public config from the selected chain.
    const { loaded, json } = await loadDefaultPublicConfigJson(p.network);

    // Session network is derived from json.network (strict if present; fallback to the chain used to read public config).
    const net = tryReadNetworkFromConfigJson(json) ?? normalizeNetworkLoose(p.network);

    await applyConfigJsonForSession(did, seed, seedPath, net, json, loaded.objectId, loaded);
  };

  const disconnect: Oid["disconnect"] = () => {
    api = null;
    s = null;
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
    get identityIsLinked() {
      return ensureSession().s.identityIsLinked;
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
    config: sessionConfig,
    raw() {
      return ensureSession().s;
    },
  };

  const base: any = {
    connect,
    disconnect,
    setSession,

    async faucet() {
      const { api, s } = ensureSession();

      const net = String(s.network).toLowerCase().trim();
      if (net !== "testnet") throw new Error("faucet is available only for an active testnet session");

      const cfg: any = await sessionConfig();
      const faucetURL = String(cfg.faucetURL).trim();
      if (!faucetURL) throw new Error("Missing faucetURL in config JSON");

      const cfgAny = cfg as any;
      const OIDcreditPackage = normalizeHex(String(cfgAny.OIDcreditPackage ?? "").trim());
      if (!OIDcreditPackage) throw new Error("Missing OIDcreditPackage in config JSON");

      const address = String(s.address).trim();

      const response = await fetch(faucetURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: OIDcreditPackage, address }),
      });

      try {
        await response.json();
      } catch {
        /* ignore */
      }

      if (!response.ok) {
        return "❌ Failed to request free credits. You own credit!";
      } else {
        return "✅ 20 free credits have been minted to your address!";
      }
    },

    officialPackages,

    get policyToken() {
      const { api } = ensureSession();
      return api.env().then((e) => e.policy);
    },

    session: sessionObj,

    // uninitialized-safe methods
    async getObject(id: string, network: string) {
      const client = new IotaClient({ url: getFullnodeUrl(network as any) });
      const obj = await getObjectRpc(client, id);
      return (obj as any) ?? null;
    },

    async getObjectsByType(type: string, network: string) {
      const cfg = await sessionConfig(network);
      const graphqlProvider = String((cfg as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in public config");
      return await graphqlAllByType(graphqlProvider, type);
    },

    async getObjectsByTypeAndOwner(type: string, owner: string, network: string) {
      const cfg = await sessionConfig(network);
      const graphqlProvider = String((cfg as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in public config");
      return await graphqlAllByTypeAndOwner(graphqlProvider, type, owner);
    },
  };

  return new Proxy(base, {
    get(_target, prop: string | symbol) {
      if (prop in base) return base[prop as any];

      if (prop === "toJSON")
        return () => ({
          connected: !!s?.initialized,
          network: s?.network,
          address: s?.address,
        });

      if (api && (api as any)[prop] !== undefined) {
        const v = (api as any)[prop];
        if (typeof v === "function" && (prop === "create_object" || prop === "create_document")) {
          return (params: any) => {
            const { s } = ensureSession();
            if (!s.identityIsLinked) throw new Error("function not allowed");
            return v.call(api, params);
          };
        }
        return typeof v === "function" ? v.bind(api) : v;
      }

      return () => notInitialized();
    },
  }) as unknown as Oid;
}
