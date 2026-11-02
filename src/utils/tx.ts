import { Transaction } from "@iota/iota-sdk/transactions";
import type { IotaClient } from "@iota/iota-sdk/client";
import type { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { TxExecResult, gasStationCfg } from "../types/types";
import { loadPublicConfig } from "../onchain/config";
import { sponsorshipMode, prepareSponsoredGas, applySponsorGas, submitSponsoredBytes } from "../sponsorship";

export async function signAndExecute(client: IotaClient, keyPair: Ed25519Keypair, tx: Transaction,
  opts: { network: string; gasBudget: number; useGasStation?: boolean; gasStation?: gasStationCfg; onExecuted?: (r: TxExecResult) => void },
): Promise<TxExecResult> {
  let res: TxExecResult = { success: false };
  try {
    const loaded = await loadPublicConfig(opts.network);
    if (sponsorshipMode(loaded.json) !== "direct") {
      const gas = await prepareSponsoredGas(client, opts.network, opts.gasBudget);
      try {
        const attempt = Transaction.from(tx);
        applySponsorGas(attempt, gas, keyPair.toIotaAddress());
        const bytes = await attempt.build({ client });
        const { signature } = await keyPair.signTransaction(bytes);
        const txEffect = await submitSponsoredBytes(client, gas, bytes, [signature]);
        res = { success: true, txDigest: txEffect.digest, status: txEffect.effects?.status, txEffect };
        return res;
      } finally { gas.release(); }
    }
    const result = await client.signAndExecuteTransaction({ signer: keyPair, transaction: tx });
    const txEffect = await client.waitForTransaction({ digest: result.digest, options: { showEffects: true } });
    const status = txEffect.effects?.status;
    res = { success: status?.status === "success", txDigest: result.digest, status, txEffect, error: status?.error };
    return res;
  } catch (error) {
    res = { success: false, error, txDigest: (error as any)?.digest };
    return res;
  } finally { try { opts.onExecuted?.(res); } catch { /* listener must not replay a transaction */ } }
}
