import { Transaction } from "@iota/iota-sdk/transactions";

import type { ObjectIdApi } from "../api";
import { signAndExecute } from "../utils/tx";
import type { IotaAddressString, ObjectIdString } from "../types/types";

export type CreateComponentParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  component_id: IotaAddressString;
  description: string;
};

export async function create_component(api: ObjectIdApi, params: CreateComponentParams) {
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
      tx.pure.string(String(description ?? "")),
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

export type DeleteComponentParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  component: ObjectIdString;
};

export async function delete_component(api: ObjectIdApi, params: DeleteComponentParams) {
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
