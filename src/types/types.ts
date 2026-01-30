import type { IotaTransactionBlockResponse, ExecutionStatus } from "@iota/iota-sdk/client";


// Convenience scalar aliases (exported for consumers + IntelliSense)
export type ObjectIdString = string;
export type IotaAddressString = string;
export type DidString = string;
export type UrlString = string;

// JSON handling
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };
/** Accept either a JSON string or a JSON value; SDK methods will serialize if needed. */
export type JsonInput = string | JsonValue;

// Integer inputs used by tx.pure.u64/u16/u8 etc.
export type U64Input = bigint | number | string;
export type U16Input = number;
export type U8Input = number | boolean | string;

// Network is intentionally a plain string.
// The provider normalizes it internally (e.g. "iota"/"mainnet" -> "mainnet").

export type gasStationCfg = {
  gasStation1URL: string;
  gasStation1Token: string;
  gasStation2URL?: string;
  gasStation2Token?: string;
};

export type ObjectIdProviderConfig = {
  network: string;
  seed: string;

  /** Optional derivation path used to deterministically derive a different key from the same seed. */
  seedPath?: string;

  /** Optional overrides */
  graphqlProvider?: string;

  /** Package IDs for oid_object (index = version). If omitted, defaults are used. */
  objectPackages?: string[];

  /** Package IDs for oid_document (index = version). If omitted, defaults are used. */
  documentPackages?: string[];

  /** Default index for objectPackages (e.g. 0=V1, 1=V2). */
  objectDefaultPackageVersion?: number;

  /** Default index for documentPackages (e.g. 0=V1, 1=V2). */
  documentDefaultPackageVersion?: number;

  /** Whether to use a Gas Station sponsor for transaction gas */
  useGasStation?: boolean;

  /** Gas Station endpoints + access tokens (required if useGasStation=true) */
  gasStation?: gasStationCfg;

  /** Default gas budget used when a method does not override it */
  gasBudget?: number;
};

export type TxExecResult = {
  success: boolean;
  txDigest?: string;
  status?: ExecutionStatus;
  error?: unknown;
  txEffect?: IotaTransactionBlockResponse;
  createdObjectId?: string;
};

export type ObjectEdge = {
  cursor?: string;
  node: {
    address: string;
    asMoveObject?: {
      contents?: {
        type?: { repr?: string };
        data?: any;
      };
    };
  };
};
