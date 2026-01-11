import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { ExecutionStatus, IotaTransactionBlockResponse, IotaClient } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

type gasStationCfg = {
    gasStation1URL: string;
    gasStation1Token: string;
    gasStation2URL?: string;
    gasStation2Token?: string;
};
type TxExecResult = {
    success: boolean;
    txDigest?: string;
    status?: ExecutionStatus;
    error?: unknown;
    txEffect?: IotaTransactionBlockResponse;
    createdObjectId?: string;
};
type ObjectEdge = {
    cursor?: string;
    node: {
        address: string;
        asMoveObject?: {
            contents?: {
                type?: {
                    repr?: string;
                };
                data?: any;
            };
        };
    };
};

type ResolvedEnv = {
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

type ObjectIdApi = {
    env: () => Promise<ResolvedEnv>;
    gasBudget: number;
    useGasStation: boolean;
    gasStation?: gasStationCfg;
    get_object: (params: {
        objectId: string;
    }) => Promise<any>;
    get_objects: (params: {
        after?: string | null;
    }) => Promise<ObjectEdge[]>;
    document_did_string: (params: {
        id: string;
    }) => string;
    add_approver_did: (params: any) => Promise<TxExecResult>;
    add_document_credit: (params: any) => Promise<TxExecResult>;
    add_editors_did: (params: any) => Promise<TxExecResult>;
    alert_message: (params: any) => Promise<TxExecResult>;
    anonymous_message: (params: any) => Promise<TxExecResult>;
    append_change_log: (params: any) => Promise<TxExecResult>;
    approve_document: (params: any) => Promise<TxExecResult>;
    control_message: (params: any) => Promise<TxExecResult>;
    counter_set_value: (params: any) => Promise<TxExecResult>;
    counter_stepdown: (params: any) => Promise<TxExecResult>;
    counter_stepup: (params: any) => Promise<TxExecResult>;
    create_component: (params: any) => Promise<TxExecResult>;
    create_counter: (params: any) => Promise<TxExecResult>;
    create_document: (params: any) => Promise<TxExecResult>;
    create_event: (params: any) => Promise<TxExecResult>;
    create_object: (params: any) => Promise<TxExecResult>;
    creator_message: (params: any) => Promise<TxExecResult>;
    delete_component: (params: any) => Promise<TxExecResult>;
    delete_counter: (params: any) => Promise<TxExecResult>;
    delete_document: (params: any) => Promise<TxExecResult>;
    delete_event: (params: any) => Promise<TxExecResult>;
    delete_object: (params: any) => Promise<TxExecResult>;
    message: (params: any) => Promise<TxExecResult>;
    remove_approver_did: (params: any) => Promise<TxExecResult>;
    remove_editors_did: (params: any) => Promise<TxExecResult>;
    update_agent_did: (params: any) => Promise<TxExecResult>;
    update_document_mutable_metadata: (params: any) => Promise<TxExecResult>;
    update_document_owner_did: (params: any) => Promise<TxExecResult>;
    update_document_status: (params: any) => Promise<TxExecResult>;
    update_document_url: (params: any) => Promise<TxExecResult>;
    update_document_url_hash: (params: any) => Promise<TxExecResult>;
    update_event_mutable_metadata: (params: any) => Promise<TxExecResult>;
    update_geo_location: (params: any) => Promise<TxExecResult>;
    update_geolocation: (params: any) => Promise<TxExecResult>;
    update_object: (params: any) => Promise<TxExecResult>;
    update_object_did: (params: any) => Promise<TxExecResult>;
    update_object_mutable_metadata: (params: any) => Promise<TxExecResult>;
    update_op_code: (params: any) => Promise<TxExecResult>;
    update_owner_did: (params: any) => Promise<TxExecResult>;
    update_publisher_did: (params: any) => Promise<TxExecResult>;
};

type Network = "testnet" | "mainnet";
type ConfigPackageIds = {
    testnet: string;
    mainnet: string;
};
type LoadedConfig = {
    source: "user" | "default";
    objectId: string;
    json: Record<string, any>;
};

type Session = {
    network: Network;
    seed: string;
    gasBudget?: number;
};
type ObjectIDProps = {
    /** Optional. If omitted, the SDK uses DEFAULT_CONFIG_PACKAGE_IDS. */
    configPackageIds?: ConfigPackageIds;
    children: React.ReactNode;
};
/**
 * ObjectID Provider that auto-loads configuration from the on-chain config package.
 *
 * External configuration: ONLY the config package ids (testnet/mainnet).
 *
 * Runtime flow:
 * - call `connect({ network, seed, gasBudget? })`
 * - provider derives address, loads user-owned Config if present; otherwise loads shared default Config
 * - provider initializes the ObjectID API with the loaded JSON config
 */
declare function ObjectID({ configPackageIds, children }: ObjectIDProps): react_jsx_runtime.JSX.Element;
declare function useOptionalObjectId(): ObjectIdApi | null;
declare function useObjectId(): ObjectIdApi;
declare function useObjectIDSession(): {
    status: "error" | "idle" | "loading" | "ready";
    error: string | null;
    session: Session | null;
    config: LoadedConfig | null;
    connect: (session: Session) => Promise<void>;
    disconnect: () => void;
    refreshConfig: () => Promise<void>;
};

export { ObjectID, type ObjectIDProps, useObjectIDSession, useObjectId, useOptionalObjectId };
