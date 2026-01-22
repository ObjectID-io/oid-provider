import { Transaction } from "@iota/iota-sdk/transactions";
import { signAndExecute } from "../tx";
import type { ObjectIdApi } from "../api";

export async function create_counter(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; value: any; unit: any; step: any; immutable_metadata: any; mutable_metadata: any }) {
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
      tx.pure.u64(value),
      tx.pure.string(unit),
      tx.pure.u64(step),
      tx.pure.string(immutable_metadata),
      tx.pure.string(mutable_metadata),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function delete_counter(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; counter: any }) {
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

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function counter_set_value(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; objectId: any; counter: any; new_value: any }) {
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
      tx.pure.u64(new_value),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function counter_stepdown(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; objectId: any; counter: any }) {
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

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function counter_stepup(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; counter: any }) {
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

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}
