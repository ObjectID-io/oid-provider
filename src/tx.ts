import type { IotaClient, IotaTransactionBlockResponse, ExecutionStatus } from "@iota/iota-sdk/client";
import type { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { Transaction } from "@iota/iota-sdk/transactions";
import type { TxExecResult } from "./types";

export async function signAndExecute(
  client: IotaClient,
  keyPair: Ed25519Keypair,
  tx: Transaction
): Promise<TxExecResult> {
  try {
    const result = await client.signAndExecuteTransaction({
      signer: keyPair,
      transaction: tx,
    });

    const txEffect: IotaTransactionBlockResponse = await client.waitForTransaction({
      digest: result.digest,
      options: { showEffects: true },
    });

    const status = txEffect.effects?.status as ExecutionStatus | undefined;
    const ok = status?.status === "success";

    return {
      success: !!ok,
      txDigest: txEffect.digest,
      status,
      error: ok ? undefined : status?.error,
      txEffect,
    };
  } catch (error) {
    return { success: false, error };
  }
}
