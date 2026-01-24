import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { ObjectIdProviderConfig } from "./types/types";
import { searchObjectsByType } from "./graphql";

export type ResolvedEnv = {
  client: IotaClient;
  keyPair: Ed25519Keypair;
  sender: string;

  network: string;
  graphqlProvider: string;

  packageID: string;
  documentPackageID: string;

  policy: string;

  tokenCreditType: string;
  policyTokenType: string;
  OIDobjectType: string;
};

function mustNonEmpty(name: string, value: any, ctx?: any): string {
  const s = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (s) return s;

  const keys = ctx && typeof ctx === "object" ? Object.keys(ctx).join(",") : "";
  throw new Error(`Missing required config field: ${name}${keys ? ` (available keys: ${keys})` : ""}`);
}

function mustArray(name: string, v: any): string[] {
  if (!Array.isArray(v) || v.length === 0) throw new Error(`Missing required config array: ${name}`);
  return v.map((x) => String(x));
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.trim().toLowerCase().replace(/^0x/, "");
  if (!h) return new Uint8Array();
  if (h.length % 2 !== 0) throw new Error("Invalid hex seed length");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // Browser + Node 20+: WebCrypto
  const subtle = (globalThis as any)?.crypto?.subtle;
  if (subtle?.digest) {
    const buf = await subtle.digest("SHA-256", data);
    return new Uint8Array(buf);
  }

  // Node fallback (should not run in the browser)
  const { createHash } = await import("crypto");
  return new Uint8Array(createHash("sha256").update(Buffer.from(data)).digest());
}

async function deriveSeedHex(seedHex: string, seedPath?: string): Promise<string> {
  const path = String(seedPath ?? "").trim();
  if (!path) return seedHex;
  const seedBytes = hexToBytes(seedHex);
  const pathBytes = new TextEncoder().encode(path);
  const data = new Uint8Array(seedBytes.length + pathBytes.length);
  data.set(seedBytes, 0);
  data.set(pathBytes, seedBytes.length);
  const h = await sha256(data);
  // 32 bytes -> 64 hex chars
  return bytesToHex(h.slice(0, 32));
}

/**
 * Resolves runtime environment using ONLY the provider configuration (loaded from on-chain oid_config).
 * No hardcoded defaults are used here.
 */
export async function resolveEnv(cfg: ObjectIdProviderConfig): Promise<ResolvedEnv> {
  const net = mustNonEmpty("network", cfg.network, cfg as any);
  const seed = mustNonEmpty("seed", cfg.seed, cfg as any);

  const graphqlProvider = mustNonEmpty("graphqlProvider", cfg.graphqlProvider, cfg as any);

  const objectPackages = mustArray("objectPackages", cfg.objectPackages);
  const documentPackages = mustArray("documentPackages", cfg.documentPackages);

  const objVer = Number(cfg.objectDefaultPackageVersion ?? 0);
  const docVer = Number(cfg.documentDefaultPackageVersion ?? 0);

  if (objVer < 0 || objVer >= objectPackages.length) {
    throw new Error(`Invalid objectDefaultPackageVersion=${objVer} (len=${objectPackages.length})`);
  }
  if (docVer < 0 || docVer >= documentPackages.length) {
    throw new Error(`Invalid documentDefaultPackageVersion=${docVer} (len=${documentPackages.length})`);
  }

  const packageID = objectPackages[objVer];
  const documentPackageID = documentPackages[docVer];

  const client = new IotaClient({ url: getFullnodeUrl(net as any) });
  const effectiveSeed = await deriveSeedHex(seed, cfg.seedPath);
  const keyPair = Ed25519Keypair.deriveKeypairFromSeed(effectiveSeed);
  const sender = keyPair.toIotaAddress();

  const tokenCreditType = `0x2::token::Token<${packageID}::oid_credit::OID_CREDIT>`;
  const policyTokenType = `0x2::token::TokenPolicy<${packageID}::oid_credit::OID_CREDIT>`;
  const OIDobjectType = `${packageID}::oid_object::OIDObject`;

  // Discover the policy object id via GraphQL (required for Move calls)
  const edges = await searchObjectsByType(policyTokenType, null, graphqlProvider);
  if (!edges?.length) throw new Error("Cannot resolve policy object (no TokenPolicy found)");
  const policy = edges[0].node.address;

  return {
    client,
    keyPair,
    sender,
    network: net,
    graphqlProvider,
    packageID,
    documentPackageID,
    policy,
    tokenCreditType,
    policyTokenType,
    OIDobjectType,
  };
}

/**
 * Converts an input value to a JSON string.
 * - If value is already a string, returns it as-is.
 * - Otherwise JSON.stringify(value). Undefined/null becomes "{}".
 */
export function asJsonString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "{}";
  return JSON.stringify(value);
}
