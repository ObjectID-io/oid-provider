import { Transaction } from "@iota/iota-sdk/transactions";
import { signAndExecute } from "../tx";
import type { ObjectIdApi } from "../api";

export async function create_object(api: ObjectIdApi, params: { creditToken: any; OIDcontrollerCap: any; object_type: any; product_url: any; product_img_url: any; description: any; op_code: any; immutable_metadata: any; mutable_metadata: any; geo_location: any }) {
  const { creditToken, OIDcontrollerCap, object_type, product_url, product_img_url, description, op_code, immutable_metadata, mutable_metadata, geo_location } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::create_object";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(OIDcontrollerCap),
      tx.pure.string(object_type),
      tx.pure.string(product_url),
      tx.pure.string(product_img_url),
      tx.pure.string(description),
      tx.pure.string(op_code),
      tx.pure.string(JSON.stringify(immutable_metadata)),
      tx.pure.string(JSON.stringify(mutable_metadata)),
      tx.pure.string(geo_location),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  if (r.success) r.createdObjectId = r.txEffect?.effects?.created?.[0]?.reference?.objectId;
  return r;
}

export async function delete_object(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any }) {
  const { creditToken, controllerCap, object } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_object";

  tx.moveCall({
    arguments: [
      tx.object(creditToken), tx.object(env.policy), tx.object(controllerCap), tx.object(object)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_agent_did(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_agent_did: any }) {
  const { creditToken, controllerCap, object, new_agent_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_agent_did";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_agent_did),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_geo_location(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_location: any }) {
  const { creditToken, controllerCap, object, new_location } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_geo_location";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_location),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_geolocation(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_location: any }) {
  const { creditToken, controllerCap, object, new_location } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_geolocation";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_location),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_object(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_product_img_url: any; new_description: any }) {
  const { creditToken, controllerCap, object, new_product_img_url, new_description } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_object";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_product_img_url),
      tx.pure.string(new_description),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_object_did(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_object_did: any }) {
  const { creditToken, controllerCap, object, new_object_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_object_did";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_object_did),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_object_mutable_metadata(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_mutable_metadata: any }) {
  const { creditToken, controllerCap, object, new_mutable_metadata } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_object_mutable_metadata";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_mutable_metadata),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_op_code(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_op_code: any }) {
  const { creditToken, controllerCap, object, new_op_code } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_op_code";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_op_code),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_owner_did(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; new_owner_did: any }) {
  const { creditToken, controllerCap, object, new_owner_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_owner_did";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_owner_did),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}
