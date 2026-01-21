import { IotaClient } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { ObjectIdProviderConfig } from "./types/types";
export type ResolvedEnv = {
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
/**
 * Resolves runtime environment using ONLY the provider configuration (loaded from on-chain oid_config).
 * No hardcoded defaults are used here.
 */
export declare function resolveEnv(cfg: ObjectIdProviderConfig): Promise<ResolvedEnv>;
/**
 * Converts an input value to a JSON string.
 * - If value is already a string, returns it as-is.
 * - Otherwise JSON.stringify(value). Undefined/null becomes "{}".
 */
export declare function asJsonString(value: unknown): string;
//# sourceMappingURL=env.d.ts.map