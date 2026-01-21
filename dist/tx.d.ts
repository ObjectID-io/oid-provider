import type { IotaClient } from "@iota/iota-sdk/client";
import type { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { Transaction } from "@iota/iota-sdk/transactions";
import type { TxExecResult, gasStationCfg } from "./types/types";
/**
 * Signs and executes a transaction.
 * - If useGasStation=true, tries gasStation1 then gasStation2 (if provided).
 * - If useGasStation=false, executes directly with user's gas.
 */
export declare function signAndExecute(client: IotaClient, keyPair: Ed25519Keypair, tx: Transaction, opts: {
    network: string;
    gasBudget: number;
    useGasStation?: boolean;
    gasStation?: gasStationCfg;
}): Promise<TxExecResult>;
//# sourceMappingURL=tx.d.ts.map