import { Transaction } from "@iota/iota-sdk/transactions";
import { IOTA_CLOCK_OBJECT_ID } from "@iota/iota-sdk/utils";

import type { ObjectIdApi } from "../api";
import { asJsonString } from "../env";
import { signAndExecute } from "../utils/tx";
import type { JsonInput, ObjectIdString } from "../types/types";

export type CreateEventParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  event_type: string;
  immutable_metadata: JsonInput;
  mutable_metadata: JsonInput;
};

export async function create_event(api: ObjectIdApi, params: CreateEventParams) {
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
      tx.pure.string(String(event_type ?? "")),
      tx.pure.string(asJsonString(immutable_metadata)),
      tx.pure.string(asJsonString(mutable_metadata)),
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

export type DeleteEventParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  event: ObjectIdString;
};

export async function delete_event(api: ObjectIdApi, params: DeleteEventParams) {
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

  // Keep old behavior: throw on explicit failure
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

export type UpdateEventMutableMetadataParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  event: ObjectIdString;
  new_mutable_metadata: JsonInput;
};

export async function update_event_mutable_metadata(api: ObjectIdApi, params: UpdateEventMutableMetadataParams) {
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
      tx.pure.string(asJsonString(new_mutable_metadata)),
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
