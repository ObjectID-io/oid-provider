import { getFullnodeUrl, IotaClient, type IotaObjectData } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";

import { createObjectIdApi, type ObjectIdApi } from "./api";
import {
  loadPublicConfig,
  loadConfigJsonByObjectId,
  type LoadedConfig,
  type Network as OnchainNetwork,
} from "./onchain/config";
import { DEFAULT_CONFIG_PACKAGE_IDS } from "./onchain/defaults";
import type { Network, ObjectIdProviderConfig, ObjectEdge } from "./types";
import { getObject as getObjectRpc } from "./getObject";

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

function normalizeHex(s: string): string {
  const t = (s ?? "").trim();
  if (!t) return t;
  return t.startsWith("0x") ? t.toLowerCase() : ("0x" + t).toLowerCase();
}

function parseDidAliasId(did: string): string | null {
  const s = (did ?? "").trim();
  if (!s) return null;
  // did:iota:testnet:0xabc...  OR did:iota:0xabc...
  const parts = s.split(":");
  const last = parts[parts.length - 1];
  if (!last) return null;
  if (last.startsWith("0x") || /^[0-9a-fA-F]+$/.test(last)) return normalizeHex(last);
  return null;
}

function deepContains(value: unknown, needle: string, maxDepth = 6): boolean {
  if (!needle) return false;
  const n = needle.toLowerCase();

  const seen = new Set<any>();
  const stack: Array<{ v: any; d: number }> = [{ v: value as any, d: 0 }];

  while (stack.length) {
    const { v, d } = stack.pop()!;
    if (v == null) continue;
    if (d > maxDepth) continue;

    if (typeof v === "string") {
      if (v.toLowerCase() === n) return true;
      if (v.toLowerCase().includes(n)) return true;
      continue;
    }

    if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") continue;

    if (seen.has(v)) continue;
    if (typeof v === "object") {
      seen.add(v);
      if (Array.isArray(v)) {
        for (const x of v) stack.push({ v: x, d: d + 1 });
      } else {
        for (const k of Object.keys(v)) {
          stack.push({ v: (v as any)[k], d: d + 1 });
        }
      }
    }
  }

  return false;
}

async function getOwnedObjectIdsByType(client: IotaClient, owner: string, targetType: string): Promise<string[]> {
  const found: string[] = [];
  let cursor: string | null = null;

  for (;;) {
    const page = await client.getOwnedObjects({
      owner,
      cursor,
      options: { showType: true, showContent: true },
    });

    const items = page?.data ?? [];
    for (const item of items) {
      const objId = item.data?.objectId;
      if (!objId) continue;

      const directType = item.data?.type;
      if (directType && directType === targetType) {
        found.push(objId);
        continue;
      }

      const content = item.data?.content as any;
      const contentType = content?.type as string | undefined;
      if (contentType && contentType === targetType) {
        found.push(objId);
      }
    }

    if (!page?.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return found;
}

function extractBalance(obj: IotaObjectData | null): string | null {
  if (!obj) return null;
  const fields = (obj as any)?.content?.fields;
  if (!fields) return null;

  // common shapes:
  // balance: "123"
  // balance: { fields: { value: "123" } }
  const b = (fields as any).balance;
  if (typeof b === "string") return b;
  if (typeof b === "number") return String(b);
  if (b && typeof b === "object") {
    const v = (b as any).fields?.value ?? (b as any).value;
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
  }

  // fallback: deep search for first numeric-like string
  const stack: any[] = [fields];
  const seen = new Set<any>();
  while (stack.length) {
    const v = stack.pop();
    if (v == null) continue;
    if (typeof v === "string" && /^[0-9]+$/.test(v)) return v;
    if (typeof v !== "object") continue;
    if (seen.has(v)) continue;
    seen.add(v);
    if (Array.isArray(v)) stack.push(...v);
    else for (const k of Object.keys(v)) stack.push((v as any)[k]);
  }

  return null;
}

async function pickCapMatchingDid(client: IotaClient, capIds: string[], did: string): Promise<string | undefined> {
  if (!capIds.length) return undefined;

  const identityId = parseDidAliasId(did);
  if (!identityId) throw new Error("Invalid DID: missing identity id");

  const matches: string[] = [];

  for (const id of capIds) {
    const obj: any = await getObjectRpc(client, id);

    // Deterministic link: ControllerCap.fields.controller_of == DID identity id (aliasId)
    const direct = obj?.content?.fields?.controller_of;
    const nested = obj?.content?.fields?.access_token?.fields?.value?.fields?.controller_of; // IOTA Identity (optional path)
    const controllerOf = normalizeHex(String(direct ?? nested ?? ""));

    if (controllerOf && controllerOf === identityId) matches.push(id);
  }

  if (matches.length === 1) return matches[0];
  if (matches.length === 0) {
    // If user owns caps but none match the provided DID, do not guess.
    throw new Error(`ControllerCap for DID not found in owned objects (did=${did})`);
  }

  // More than one match should not happen; treat as inconsistent state.
  throw new Error(`Multiple ControllerCaps match DID (did=${did})`);
}

async function graphqlAllByType(graphqlProvider: string, type: string): Promise<ObjectEdge[]> {
  const query = `
    query ($type: String!, $after: String) {
      objects(filter: { type: $type }, first: 50, after: $after) {
        edges {
          cursor
          node {
            address
            asMoveObject {
              contents { type { repr } data }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const edges: ObjectEdge[] = [];
  let after: string | null = null;

  for (;;) {
    const resp = await fetch(graphqlProvider, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { type, after } }),
    });

    const json = (await resp.json().catch(() => null)) as any;
    if (!resp.ok) throw Object.assign(new Error(`GraphQL HTTP ${resp.status}`), { status: resp.status, json });
    if (json?.errors) throw Object.assign(new Error("GraphQL errors"), { errors: json.errors });

    const page = json?.data?.objects;
    const pageEdges = page?.edges as ObjectEdge[] | undefined;
    if (pageEdges?.length) edges.push(...pageEdges);

    const hasNext = !!page?.pageInfo?.hasNextPage;
    const endCursor = (page?.pageInfo?.endCursor ?? null) as string | null;

    if (!hasNext || !endCursor) break;
    after = endCursor;
  }

  return edges;
}

async function graphqlAllByTypeAndOwner(graphqlProvider: string, type: string, owner: string): Promise<ObjectEdge[]> {
  const query = `
    query ($type: String!, $after: String, $owner: IotaAddress) {
      objects(filter: { type: $type, owner: $owner }, first: 50, after: $after) {
        edges {
          cursor
          node {
            address
            asMoveObject {
              contents { type { repr } data }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const edges: ObjectEdge[] = [];
  let after: string | null = null;

  for (;;) {
    const resp = await fetch(graphqlProvider, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { type, after, owner } }),
    });

    const json = (await resp.json().catch(() => null)) as any;
    if (!resp.ok) throw Object.assign(new Error(`GraphQL HTTP ${resp.status}`), { status: resp.status, json });
    if (json?.errors) throw Object.assign(new Error("GraphQL errors"), { errors: json.errors });

    const page = json?.data?.objects;
    const pageEdges = page?.edges as ObjectEdge[] | undefined;
    if (pageEdges?.length) edges.push(...pageEdges);

    const hasNext = !!page?.pageInfo?.hasNextPage;
    const endCursor = (page?.pageInfo?.endCursor ?? null) as string | null;

    if (!hasNext || !endCursor) break;
    after = endCursor;
  }

  return edges;
}

export type Oid = ObjectIdApi & {
  /** Initializes the provider. Required before calling tx methods. */
  config: (did: string, seed: string, network: Network) => Promise<void>;
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
    publicConfig?: LoadedConfig
  ) => {
    const merged: ObjectIdProviderConfig = {
      ...(cfgJson as any),
      network,
      seed,
    };

    api = createObjectIdApi(merged);

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

    const publicCfg = await loadPublicConfig(network as unknown as OnchainNetwork);
    const cfgJson = publicCfg.json ?? {};
    await applyConfigJson(seed, did, network, cfgJson, undefined, publicCfg);
  };

  const config = async (did: string, seed: string, network: Network) => {
    await configParams({ did, seed, network });
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
    configParams,
    session: sessionObj,

    // uninitialized-safe methods
    async getObject(id: string, network: Network) {
      const client = new IotaClient({ url: getFullnodeUrl(network as any) });
      const obj = await getObjectRpc(client, id);
      return (obj as any) ?? null;
    },

    async getObjectsByType(type: string, network: Network) {
      const publicCfg = await loadPublicConfig(network as unknown as OnchainNetwork);
      const graphqlProvider = String((publicCfg.json as any)?.graphqlProvider ?? "").trim();
      if (!graphqlProvider) throw new Error("graphqlProvider not found in public config");
      return await graphqlAllByType(graphqlProvider, type);
    },

    async getObjectsByTypeAndOwner(type: string, owner: string, network: Network) {
      const publicCfg = await loadPublicConfig(network as unknown as OnchainNetwork);
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
