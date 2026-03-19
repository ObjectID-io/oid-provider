import type {
  IotaClient,
  IotaTransactionBlockResponse,
  ExecutionStatus,
  TransactionEffects,
} from "@iota/iota-sdk/client";
import type { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import type { Transaction, ObjectRef } from "@iota/iota-sdk/transactions";
import type { TxExecResult, gasStationCfg } from "../types/types";

/**
 * Browser-safe Uint8Array -> base64 encoding (no Buffer).
 */
function u8ToB64(u8: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    s += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(s);
}

type ReserveGasResult = {
  sponsor_address: string;
  reservation_id: number;
  gas_coins: ObjectRef[];
};

async function postJson<T>(url: string, token: string | undefined, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, data });
  return data as T;
}

async function reserveGas(
  gasBudget: number,
  gasStationUrl: string,
  gasStationToken: string,
): Promise<ReserveGasResult> {
  const resp = await postJson<any>(`${gasStationUrl}/v1/reserve_gas`, gasStationToken, {
    gas_budget: gasBudget,
    reserve_duration_secs: 10,
  });
  return resp?.result as ReserveGasResult;
}

async function sponsorSignAndSubmit(
  reservationId: number,
  txBytes: Uint8Array,
  userSig: string,
  gasStationUrl: string,
  gasStationToken: string,
): Promise<TransactionEffects> {
  const resp = await postJson<any>(`${gasStationUrl}/v1/execute_tx`, gasStationToken, {
    reservation_id: reservationId,
    tx_bytes: u8ToB64(txBytes),
    user_sig: userSig,
  });
  return resp?.effects as TransactionEffects;
}

async function attemptWithGasStation(
  network: string,
  client: IotaClient,
  keyPair: Ed25519Keypair,
  tx: Transaction,
  gasBudget: number,
  gasStationUrl: string,
  gasStationToken: string,
): Promise<TxExecResult> {
  const reserved = await reserveGas(gasBudget, gasStationUrl, gasStationToken);

  tx.setSender(keyPair.toIotaAddress());
  tx.setGasOwner(reserved.sponsor_address);
  tx.setGasPayment(reserved.gas_coins);
  tx.setGasBudget(gasBudget);

  const unsignedTxBytes = await tx.build({ client });
  const signedTx = await keyPair.signTransaction(unsignedTxBytes);
  const userSig = (signedTx as any).signature;

  const effects = await sponsorSignAndSubmit(
    reserved.reservation_id,
    unsignedTxBytes,
    userSig,
    gasStationUrl,
    gasStationToken,
  );

  const txEffect = {
    digest: (effects as any).transactionDigest,
    effects,
  } as IotaTransactionBlockResponse;

  const status = (txEffect.effects as any)?.status as ExecutionStatus | undefined;
  const ok = status?.status === "success";

  return {
    success: !!ok,
    txDigest: txEffect.digest,
    status,
    error: ok ? undefined : (status as any)?.error,
    txEffect,
  };
}

/**
 * Signs and executes a transaction.
 * - If useGasStation=true, tries gasStation1 then gasStation2 (if provided).
 * - If useGasStation=false, executes directly with user's gas.
 */
export async function signAndExecute(
  client: IotaClient,
  keyPair: Ed25519Keypair,
  tx: Transaction,
  opts: {
    network: string;
    gasBudget: number;
    useGasStation?: boolean;
    gasStation?: gasStationCfg;
    /**
     * Called when the tx execution attempt completes (success OR failure).
     * Useful to trigger credit refresh hints deterministically.
     */
    onExecuted?: (r: TxExecResult) => void;
  },
): Promise<TxExecResult> {
  let res: TxExecResult = { success: false, error: new Error("Unknown error") };

  try {
    if (opts.useGasStation) {
      const gs = opts.gasStation;
      if (!gs?.gasStation1URL || !gs?.gasStation1Token) {
        throw new Error("useGasStation=true but gasStation config is missing.");
      }

      try {
        res = await attemptWithGasStation(
          opts.network,
          client,
          keyPair,
          tx,
          opts.gasBudget,
          gs.gasStation1URL,
          gs.gasStation1Token,
        );
      } catch (e1) {
        if (gs.gasStation2URL && gs.gasStation2Token) {
          res = await attemptWithGasStation(
            opts.network,
            client,
            keyPair,
            tx,
            opts.gasBudget,
            gs.gasStation2URL,
            gs.gasStation2Token,
          );
        } else {
          throw e1;
        }
      }

      return res;
    }

    // Direct execution (user pays gas)
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

    res = {
      success: !!ok,
      txDigest: txEffect.digest,
      status,
      error: ok ? undefined : status?.error,
      txEffect,
    };

    return res;
  } catch (error) {
    res = { success: false, error };
    return res;
  } finally {
    try {
      opts.onExecuted?.(res);
    } catch {
      // ignore listener errors
    }
  }
}
