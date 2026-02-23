// Server-safe entrypoint (no React exports)
export type { ObjectIdProviderConfig, TxExecResult, ObjectEdge } from "./types/types";

// Core API
export type { ObjectIdApi, TxMethodName, TxMethods, MethodParams, MethodReturn } from "./api";
export { createObjectIdApi } from "./api";

// OID high-level wrapper
export { createOid, type Oid, type OidSession, type ConnectParams, type Network } from "./oid";

// On-chain config helpers/types (server-safe)
export type { ConfigPackageIds, LoadedConfig } from "./onchain/config";
export {
  loadPublicConfig,
  loadConfigJsonByObjectId,
  loadEffectiveConfig,
  findUserConfigObjectId,
  configType,
  dlvcProxyUrl,
} from "./onchain/config";
export { DEFAULT_CONFIG_PACKAGE_IDS, DEFAULT_SHARED_CONFIG_OBJECT_ID, type CanonicalNetwork } from "./onchain/defaults";
