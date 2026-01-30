import { Transaction } from "@iota/iota-sdk/transactions";

import type { ObjectIdApi } from "../api";
import { asJsonString } from "../env";
import { signAndExecute } from "../utils/tx";
import type { JsonInput, ObjectIdString, U64Input } from "../types/types";

export type CreateCounterParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  value: U64Input;
  unit: string;
  step: U64Input;
  immutable_metadata: JsonInput;
  mutable_metadata: JsonInput;
};

export async function create_counter(api: ObjectIdApi, params: CreateCounterParams) {
  const { creditToken, controllerCap, object, value, unit, step, immutable_metadata, mutable_metadata } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::create_counter";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.pure.address(object),
      tx.pure.u64(value as any),
      tx.pure.string(String(unit ?? "")),
      tx.pure.u64(step as any),
      tx.pure.string(asJsonString(immutable_metadata)),
      tx.pure.string(asJsonString(mutable_metadata)),
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

export type DeleteCounterParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  counter: ObjectIdString;
};

export async function delete_counter(api: ObjectIdApi, params: DeleteCounterParams) {
  const { creditToken, controllerCap, object, counter } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_counter";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(counter),
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

export type CounterSetValueParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  objectId: ObjectIdString;
  counter: ObjectIdString;
  new_value: U64Input;
};

export async function counter_set_value(api: ObjectIdApi, params: CounterSetValueParams) {
  const { creditToken, controllerCap, objectId, counter, new_value } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::counter_set_value";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(objectId),
      tx.object(counter),
      tx.pure.u64(new_value as any),
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

export type CounterStepParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  objectId: ObjectIdString;
  counter: ObjectIdString;
};

export async function counter_stepdown(api: ObjectIdApi, params: CounterStepParams) {
  const { creditToken, controllerCap, objectId, counter } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::counter_stepdown";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(objectId),
      tx.object(counter),
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

export type CounterStepUpParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  counter: ObjectIdString;
};

export async function counter_stepup(api: ObjectIdApi, params: CounterStepUpParams) {
  const { creditToken, controllerCap, object, counter } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::counter_stepup";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(counter),
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
