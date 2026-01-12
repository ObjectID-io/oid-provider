import type { ObjectIdApi } from "../api";
import type { ConfigPackageIds, LoadedConfig, Network } from "../onchain/config";
type Session = {
    network: Network;
    seed: string;
    gasBudget?: number;
    did?: string;
};
type ActiveConfig = LoadedConfig & {
    source: "default" | "object";
};
type Ctx = {
    api: ObjectIdApi | null;
    /** Session is set only after connect(). */
    session: Session | null;
    /** The public/shared config for the currently selected network. */
    publicConfig: LoadedConfig | null;
    /** The active config used by the API (public by default, or overridden by applyCfg/applyCfgObject). */
    activeConfig: ActiveConfig | null;
    status: "idle" | "loading" | "ready" | "error";
    error: string | null;
    /** Selected network even before connect(). Defaults to testnet. */
    selectedNetwork: Network;
    /** Loads the public config for `network` and makes it active (drops any previous override). */
    selectNetwork: (network: Network) => Promise<void>;
    /** Sets seed and network, loads the public config for that network, and initializes the API with it. */
    connect: (session: Session) => Promise<void>;
    /** Clears session, API, and overrides; reloads public config for testnet and makes it active. */
    disconnect: () => Promise<void>;
    /** Reloads public config for current selectedNetwork; if active is public, updates it too. */
    refreshPublicConfig: () => Promise<void>;
    /** Forces active config back to public config (does not delete any on-chain objects). */
    usePublicConfig: () => Promise<void>;
    /**
     * Applies a JSON config by:
     * - creating a PRIVATE (owned) oid_config::Config on-chain
     * - returning the created objectId
     * - setting it as active config (and rebuilding API)
     */
    applyCfg: (json: Record<string, any>) => Promise<string>;
    /** Loads a config objectId and sets it as active config (and rebuilds API). */
    applyCfgObject: (objectId: string) => Promise<string>;
};
export type ObjectIDProps = {
    /** Optional. If omitted, the SDK uses DEFAULT_CONFIG_PACKAGE_IDS. */
    configPackageIds?: ConfigPackageIds;
    children: React.ReactNode;
};
export declare function ObjectID({ configPackageIds, children }: ObjectIDProps): import("react/jsx-runtime").JSX.Element;
export declare function useOptionalObjectId(): ObjectIdApi | null;
export declare function useObjectId(): ObjectIdApi;
export declare function useObjectIDSession(): Ctx;
export {};
//# sourceMappingURL=ObjectIdProvider.d.ts.map