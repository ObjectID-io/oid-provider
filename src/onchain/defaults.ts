import type { ConfigPackageIds } from "./config";

// Canonical network keys for on-chain defaults.
export type CanonicalNetwork = "testnet" | "mainnet";

/**
 * Built-in default config package IDs.
 * Override at runtime by passing `configPackageIds` prop to <ObjectID />.
 */
export const DEFAULT_CONFIG_PACKAGE_IDS: ConfigPackageIds = {
  testnet: "0x7560b5cb2024a3a712ed1e09f4e42ba806b886a44262c9d40ac31fbcfeb30cc0",
  mainnet: "0x6148d3674590634d59f8f972d71dd6148e014dd9c036c048d446853dd80049f4",
};

/**
 * Built-in shared DEFAULT Config object ids (oid_config::Config) for each network.
 * These are the shared objects created at publish/init time.
 */
export const DEFAULT_SHARED_CONFIG_OBJECT_ID: Record<string, string> = {
  testnet: "0xf9d3f786ac5ee53f293b87f6800eee852d6e7263d78275377f5d13db04f4be15",
  mainnet: "0x3351d3692783c1b569d6ebe8b0ede46dec51e5688b2892d20b32c0a94414043d",
};
