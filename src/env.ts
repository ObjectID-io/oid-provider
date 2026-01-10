import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { ObjectIdProviderConfig } from "./types";
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

const DEFAULTS = {
  testnet: {
    packageID: "0x79857c1738f31d70165149678ae051d5bffbaa26dbb66a25ad835e09f2180ae5",
    documentPackageID: "0x6e884a623d5661fca38cf9601cbc9fb85fa1d5aaff28a1fe96d260437b971ba7",
    graphqlProvider: "https://graphql.testnet.iota.cafe/",
  },
  mainnet: {
    packageID: "0xc6b77b8ab151fda5c98b544bda1f769e259146dc4388324e6737ecb9ab1a7465",
    documentPackageID: "0x23ba3cf060ea3fbb53542e1a3347ee1eb215913081fecdf1eda462c3101da556",
    graphqlProvider: "https://graphql.mainnet.iota.cafe/",
  },
} as const;

export function asJsonString(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export async function resolveEnv(cfg: ObjectIdProviderConfig): Promise<ResolvedEnv> {
  const net = String(cfg.network);
  const d = net === "mainnet" ? DEFAULTS.mainnet : DEFAULTS.testnet;

  const packageID = cfg.packageID ?? d.packageID;
  const documentPackageID = cfg.documentPackageID ?? d.documentPackageID;
  const graphqlProvider = cfg.graphqlProvider ?? d.graphqlProvider;

  const client = new IotaClient({ url: getFullnodeUrl(net as any) });
  const keyPair = Ed25519Keypair.deriveKeypairFromSeed(cfg.seed);
  const sender = keyPair.toIotaAddress();

  const tokenCreditType = `0x2::token::Token<${packageID}::oid_credit::OID_CREDIT>`;
  const policyTokenType = `0x2::token::TokenPolicy<${packageID}::oid_credit::OID_CREDIT>`;
  const OIDobjectType = `${packageID}::oid_object::OIDObject`;

  const pedges = await searchObjectsByType(policyTokenType, null, graphqlProvider);
  const policy = pedges[0]?.node?.address;
  if (!policy) throw new Error("Policy object not found via GraphQL.");

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
