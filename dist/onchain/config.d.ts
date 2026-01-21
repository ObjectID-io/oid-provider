import { IotaClient } from "@iota/iota-sdk/client";
export type Network = "testnet" | "mainnet";
export type ConfigPackageIds = {
    testnet: string;
    mainnet: string;
};
export type LoadedConfig = {
    source: "user" | "default" | "manual" | "object";
    objectId: string;
    json: Record<string, any>;
};
export declare function getObjectJson(client: IotaClient, objectId: string): Promise<Record<string, any>>;
/**
 * Loads a config JSON stored as UTF-8 bytes in `Config.json` (vector<u8>) by object id.
 * Uses JSON-RPC only (browser CORS must allow the node endpoint).
 */
export declare function loadConfigJsonByObjectId(network: Network, objectId: string): Promise<Record<string, any>>;
export declare function configType(packageId: string): string;
/**
 * Finds the latest user-owned Config object for the given address, if any.
 * IMPORTANT: filters strictly by StructType == <cfgPkg>::oid_config::Config (no suffix matching).
 */
export declare function findUserConfigObjectId(client: IotaClient, owner: string, configPkgId: string): Promise<string | null>;
/**
 * Loads the effective config:
 * 1) user-owned Config (same configPkgId) if present
 * 2) HARD default shared Config pinned in DEFAULT_SHARED_CONFIG_OBJECT_ID[network]
 *
 * No discovery via tx and no GraphQL.
 */
/**
 * Loads the public/shared default config for a given network (pinned object id).
 * This does NOT attempt to load any user-owned config.
 */
export declare function loadPublicConfig(network: Network): Promise<LoadedConfig>;
export declare function loadEffectiveConfig(network: Network, configPkgs: ConfigPackageIds, ownerAddress: string): Promise<LoadedConfig>;
export declare const dlvcProxyUrl = "https://api.objectid.io/api/dlvc-proxy";
//# sourceMappingURL=config.d.ts.map