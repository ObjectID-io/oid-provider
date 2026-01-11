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
 * Finds the shared default Config object id by looking for the most recent tx calling:
 *   <pkg>::oid_config::set_default_json
 * and extracting the mutated/created Config object id from objectChanges.
 *
 * This avoids GraphQL and does not require you to hardcode the shared object id.
 */
export declare function findDefaultConfigObjectId(client: IotaClient, configPkgId: string): Promise<string>;
/**
 * Finds the latest user-owned Config object for the given address, if any.
 */
export declare function findUserConfigObjectId(client: IotaClient, owner: string, configPkgId: string): Promise<string | null>;
export declare function loadEffectiveConfig(network: Network, configPkgs: ConfigPackageIds, ownerAddress: string): Promise<LoadedConfig>;
//# sourceMappingURL=config.d.ts.map