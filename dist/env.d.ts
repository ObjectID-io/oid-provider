import { IotaClient } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { ObjectIdProviderConfig } from "./types";
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
export declare function asJsonString(v: unknown): string;
export declare function resolveEnv(cfg: ObjectIdProviderConfig): Promise<ResolvedEnv>;
//# sourceMappingURL=env.d.ts.map