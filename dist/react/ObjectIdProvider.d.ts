import React from "react";
import type { ObjectIdApi } from "../api";
import type { ConfigPackageIds, LoadedConfig, Network } from "../onchain/config";
type Session = {
    network: Network;
    seed: string;
    gasBudget?: number;
};
export type ObjectIDProps = {
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
export declare function ObjectID({ configPackageIds, children }: ObjectIDProps): import("react/jsx-runtime").JSX.Element;
export declare function useOptionalObjectId(): ObjectIdApi | null;
export declare function useObjectId(): ObjectIdApi;
export declare function useObjectIDSession(): {
    status: "error" | "idle" | "loading" | "ready";
    error: string | null;
    session: Session | null;
    config: LoadedConfig | null;
    connect: (session: Session) => Promise<void>;
    disconnect: () => void;
    refreshConfig: () => Promise<void>;
    applyCfg: (json: Record<string, any>) => Promise<void>;
    applyCfgObject: (objectId: string) => Promise<void>;
};
export {};
//# sourceMappingURL=ObjectIdProvider.d.ts.map