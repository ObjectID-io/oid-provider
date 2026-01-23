// src/onchain/defaults.ts
import type { ConfigPackageIds } from "./config";

/** Canonical networks supported by pinned on-chain default config objects. */
export type CanonicalNetwork = "testnet" | "mainnet";

export const DEFAULT_SHARED_CONFIG_OBJECT_ID: Record<CanonicalNetwork, string> = {
  testnet: "0x7aa63a81769d7cf6f4c8ae17d95ec717b74bdc651e2b8b3d4141442d1b93d0eb",
  mainnet: "0xf4079a196b734992e13160ee3c0bdad0ad8f828e4287fb46d52bfe8f88ed4e41",
};

export const DEFAULT_CONFIG_PACKAGE_IDS: ConfigPackageIds = {
  testnet: "0xfc3da4c5862a7c07d71a9f7ee9fb288eb82b8425f9bddcd17e9e288924cd8d65",
  mainnet: "0xb333432b6e17ab29c7d5ddcbbefafcc8f52badf1d4660a93f36266a5b1e6990e",
};
