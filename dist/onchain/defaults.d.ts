import type { ConfigPackageIds, Network } from "./config";
/**
 * Built-in default config package IDs.
 * Override at runtime by passing `configPackageIds` prop to <ObjectID />.
 */
export declare const DEFAULT_CONFIG_PACKAGE_IDS: ConfigPackageIds;
/**
 * Built-in shared DEFAULT Config object ids (oid_config::Config) for each network.
 * These are the shared objects created at publish/init time.
 */
export declare const DEFAULT_SHARED_CONFIG_OBJECT_ID: Record<Network, string>;
//# sourceMappingURL=defaults.d.ts.map