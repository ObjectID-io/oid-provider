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

  creditTokens: string[];
  activeCreditToken?: string;
};

export type ConnectParams = {
  did: string;
  seed: string;
  network?: Network;
  seedPath?: string;
};

type CustomConfigArg = Record<string, any> | { json: Record<string, any> } | { objectId: string } | string; // shorthand: objectId

function notInitialized(): never {
  throw new Error("not initialized");
}

function normalizeNetwork(network?: string): Network {
  const n = String(network ?? "")
    .toLowerCase()
    .trim();
  if (n === "mainnet" || n === "iota") return "mainnet";
  return (n || "testnet") as Network;
}

function mergeConfig(official: Record<string, any>, custom?: Record<string, any> | null) {
  if (!custom) return official;
  // shallow override (intenzionale, semplice)
  return { ...official, ...custom };
}

function extractOfficialPackages(json: Record<string, any>): string[] {
  const raw =
    (json as any)?.officialPackages ?? (json as any)?.official_packages ?? (json as any)?.official_packages_ids ?? [];
  const arr = Array.isArray(raw) ? raw : [];
  const out = arr.map((x) => normalizeHex(String(x ?? "").trim())).filter((x) => !!x);
  // unique
  return Array.from(new Set(out));
}

export type Oid = ObjectIdApi & {
  /** Reset session state (no-op if already disconnected). */
  disconnect: () => void;

  /** Init session (tx signing). */
  connect: (p: ConnectParams) => Promise<void>;

  /** Request free credits (testnet only; requires an active session). */
  faucet: () => Promise<string>;

  /** Read ONLY the official allow-list from on-chain public config. Works without session. */
  officialPackages: (network?: string) => Promise<string[]>;

  /** Session accessors */
  session: {
    readonly network: Network;
    readonly did: string;
    readonly address: string;

    readonly oidControllerCap?: string;
    readonly identityControllerCap?: string;

    readonly creditTokens: string[];
    creditToken: (id?: string) => string | undefined;

    credit: () => Promise<string | null>;
    onCreditChanged: (cb: (r: TxExecResult) => void) => () => void;

    /**
     * Loads OFFICIAL on-chain config for a network and optionally merges a custom override.
     * Works even WITHOUT session.
     *
     * - session.config() -> official config for (session.network if connected else "testnet")
     * - session.config("testnet") -> official config testnet
     * - session.config("testnet", { ...override }) -> official + override
     * - session.config("testnet", { objectId }) / session.config("testnet", "0x...") -> official + json loaded by objectId
     */
    config: (network?: string, custom?: CustomConfigArg) => Promise<Record<string, any>>;

    /** Session snapshot (requires connect). */
    raw: () => OidSession;
  };

  /** Methods usable without initialization. */
  getObject: (id: string, network: string) => Promise<IotaObjectData | null>;
  getObjectsByType: (type: string, network: string) => Promise<ObjectEdge[]>;
  getObjectsByTypeAndOwner: (type: string, owner: string, network: string) => Promise<ObjectEdge[]>;
};

function pickStringByNetwork(value: any, network: string): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const v: any = value;
    const pick = v[network] ?? v[String(network).toLowerCase()] ?? v.testnet ?? v.mainnet;
    if (typeof pick === "string") return pick.trim();
  }
  return "";
}

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

  const loadOfficialConfig = async (network?: string) => {
    const net = normalizeNetwork(network);
    const loaded = await loadPublicConfig(net as any);
    return { net, loaded, json: (loaded.json ?? {}) as Record<string, any> };
  };

  const resolveCustomConfig = async (net: string, custom?: CustomConfigArg): Promise<Record<string, any> | null> => {
    if (!custom) return null;

    // shorthand objectId string
    if (typeof custom === "string") {
      const objectId = custom.trim();
      if (!objectId) return null;
      return await loadConfigJsonByObjectId(net as any, objectId);
    }

    if (typeof custom === "object" && custom !== null && !Array.isArray(custom)) {
      if (typeof (custom as any).objectId === "string") {
        const objectId = String((custom as any).objectId).trim();
        if (!objectId) return null;
        return await loadConfigJsonByObjectId(net as any, objectId);
      }
      if (Object.prototype.hasOwnProperty.call(custom, "json")) {
        return ((custom as any).json ?? {}) as Record<string, any>;
      }
      // raw override json
      return custom as Record<string, any>;
    }

    return null;
  };

  const sessionConfig: Oid["session"]["config"] = async (network?: string, custom?: CustomConfigArg) => {
    // default network: session.network if connected else "testnet"
    const net = normalizeNetwork(network ?? s?.network ?? "testnet");

    const { loaded, json: officialJson } = await loadOfficialConfig(net);
    const customJson = await resolveCustomConfig(net, custom);

    // merge official + custom (override)
    const merged = mergeConfig(officialJson, customJson);

    // optional: attach loaded metadata if you want to debug (non breaking)
    (merged as any).__source = "official";
    (merged as any).__officialObjectId = loaded.objectId;

    if (customJson) (merged as any).__custom = true;

    return merged;
  };

  const officialPackages: Oid["officialPackages"] = async (network?: string) => {
    const { json } = await loadOfficialConfig(network);
    return extractOfficialPackages(json);
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

  const connect: Oid["connect"] = async (p: ConnectParams) => {
    const did = String(p?.did ?? "").trim();
    const seed = String(p?.seed ?? "").trim();
    const seedPath = String(p?.seedPath ?? "").trim() || undefined;
    if (!did) throw new Error("DID is required.");
    if (!seed) throw new Error("Seed is required.");

    const net = normalizeNetwork(p.network ?? "testnet");

    // OFFICIAL config onchain for this network (no seed needed)
    const { loaded, json } = await loadOfficialConfig(net);

    await applyConfigJsonForSession(did, seed, seedPath, net, json, loaded.objectId, loaded);
  };

  const disconnect: Oid["disconnect"] = () => {
    api = null;
    s = null;
    // NB: non tocchiamo nulla che riguarda letture pubbliche
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
    config: sessionConfig,
    raw() {
      return ensureSession().s;
    },
  };

  const base: any = {
    connect,
    disconnect,
    async faucet() {
      const { s } = ensureSession();

      const net = String(s.network).toLowerCase().trim();
      if (net !== "testnet") throw new Error("faucet is available only for an active testnet session");

      // ✅ usa SEMPRE la config ufficiale corrente di rete
      const cfg: any = await sessionConfig(s.network);
      s.configJson = cfg; // aggiorna snapshot sessione

      const faucetURL = String(cfg.faucetURL).trim();
      if (!faucetURL) throw new Error("Missing faucetURL in config JSON");

      const OIDcreditPackage = normalizeHex(String(cfg.OIDcreditPackage).trim());
      if (!OIDcreditPackage) throw new Error("Missing OIDcreditPackage in config JSON");

      const address = String(s.address).trim();

      const response = await fetch(faucetURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ OIDcreditPackage, address }),
      });

      // il backend deve rispondere JSON
      await response.json();

      if (response.ok) {
        return "✅ 20 free credits have been minted to your address!";
      } else {
        return "❌ Failed to request free credits. You own credit!";
      }
    },
    officialPackages,
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
      if (!graphqlProvider) throw new Error("graphqlProvider not found in official config");
      return await graphqlAllByType(graphqlProvider, type);
    },

    async getObjectsByTypeAndOwner(type: string, owner: string, network: string) {
      const cfg = await sessionConfig(network);
      const graphqlProvider = String((cfg as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in official config");
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
        return typeof v === "function" ? v.bind(api) : v;
      }

      return () => notInitialized();
    },
  }) as unknown as Oid;
}
