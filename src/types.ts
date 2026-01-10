import type { IotaTransactionBlockResponse, ExecutionStatus } from "@iota/iota-sdk/client";

export type Network = "testnet" | "mainnet" | (string & {});

export type ObjectIdProviderConfig = {
  network: Network;
  seed: string;

  /** Optional overrides */
  graphqlProvider?: string;
  packageID?: string;
  documentPackageID?: string;

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
