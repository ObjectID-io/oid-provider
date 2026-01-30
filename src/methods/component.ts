import { Transaction } from "@iota/iota-sdk/transactions";
import { signAndExecute } from "../utils/tx";
import type { ObjectIdApi } from "../api";

export async function create_component(
  api: ObjectIdApi,
  params: { creditToken: any; controllerCap: any; object: any; component_id: any; description: any },
) {
  const { creditToken, controllerCap, object, component_id, description } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::create_component";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.address(component_id),
      tx.pure.string(description),
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

export async function delete_component(
  api: ObjectIdApi,
  params: { creditToken: any; controllerCap: any; object: any; component: any },
) {
  const { creditToken, controllerCap, object, component } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_component";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(component),
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
