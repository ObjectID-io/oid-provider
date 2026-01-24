import type { IotaTransactionBlockResponse, ExecutionStatus } from "@iota/iota-sdk/client";

// NOTE: deliberately wide for client simplicity.
// Internally we normalize to canonical networks where needed.
export type Network = string;

export type gasStationCfg = {
  gasStation1URL: string;
  gasStation1Token: string;
  gasStation2URL?: string;
  gasStation2Token?: string;
};


export type ObjectIdProviderConfig = {
  network: Network;
  seed: string;

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
