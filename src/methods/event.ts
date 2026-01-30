import { Transaction } from "@iota/iota-sdk/transactions";
import { signAndExecute } from "../utils/tx";
import type { ObjectIdApi } from "../api";
import { IOTA_CLOCK_OBJECT_ID } from "@iota/iota-sdk/utils";

export async function create_event(
  api: ObjectIdApi,
  params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    event_type: any;
    immutable_metadata: any;
    mutable_metadata: any;
  },
) {
  const { creditToken, controllerCap, object, event_type, immutable_metadata, mutable_metadata } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::create_event";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(event_type),
      tx.pure.string(immutable_metadata),
      tx.pure.string(mutable_metadata),
      tx.object(IOTA_CLOCK_OBJECT_ID),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, {
    network: env.network,
    gasBudget,
    useGasStation: api.useGasStation,
    gasStation: api.gasStation,
    onExecuted: (api as any).onTxExecuted,
  });
  return r;
}
export async function delete_event(
  api: ObjectIdApi,
  params: { creditToken: any; controllerCap: any; object: any; event: any },
) {
  const { creditToken, controllerCap, object, event } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget ?? 10_000_000;

  const tx = new Transaction();
  const moveFunction = `${env.packageID}::oid_object::delete_event`;

  tx.moveCall({
    target: moveFunction,
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(event),
    ],
  });

  tx.setGasBudget(gasBudget);
  tx.setSender(env.sender);

  const r: any = await signAndExecute(env.client, env.keyPair, tx, {
    network: env.network,
    gasBudget,
    useGasStation: api.useGasStation,
    gasStation: api.gasStation,
    onExecuted: (api as any).onTxExecuted,
  });

  console.log("[provider.delete_event] result:", r);

  const digest = String(r?.txDigest ?? r?.digest ?? r?.transactionDigest ?? "").trim();

  if (r?.success === false) {
    const detail = String(r?.error ?? r?.status?.error ?? r?.status?.errorMessage ?? "Transaction failed");
    const err: any = new Error(`${detail}${digest ? ` (tx ${digest})` : ""}`);
    err.digest = digest;
    err.raw = r;
    throw err;
  }

  return r;
}

export async function update_event_mutable_metadata(
  api: ObjectIdApi,
  params: { creditToken: any; controllerCap: any; event: any; new_mutable_metadata: any },
) {
  const { creditToken, controllerCap, event, new_mutable_metadata } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_event_mutable_metadata";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(event),
      tx.pure.string(new_mutable_metadata),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, {
    network: env.network,
    gasBudget,
    useGasStation: api.useGasStation,
    gasStation: api.gasStation,
    onExecuted: (api as any).onTxExecuted,
  });
  return r;
}
