import { Transaction } from "@iota/iota-sdk/transactions";
import { signAndExecute } from "../tx";
import type { ObjectIdApi } from "../api";

export async function alert_message(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; message: any; message_code: any; geolocation: any; link: any }) {
  const { creditToken, controllerCap, object, message, message_code, geolocation, link } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::alert_message";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(message),
      tx.pure.u16(message_code),
      tx.pure.string(geolocation),
      tx.pure.string(link),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function anonymous_message(api: ObjectIdApi, params: { object: any; geolocation: any }) {
  const { object, geolocation } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::anonymous_message";

  tx.moveCall({
    arguments: [
      tx.object(object), tx.pure.string(geolocation)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function control_message(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; message: any; message_code: any; geolocation: any; link: any }) {
  const { creditToken, controllerCap, object, message, message_code, geolocation, link } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::control_message";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(message),
      tx.pure.u16(message_code),
      tx.pure.string(geolocation),
      tx.pure.string(link),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function creator_message(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; message: any; message_code: any; geolocation: any; link: any }) {
  const { creditToken, controllerCap, object, message, message_code, geolocation, link } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::creator_message";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(message),
      tx.pure.u16(message_code),
      tx.pure.string(geolocation),
      tx.pure.string(link),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function message(api: ObjectIdApi, params: { creditToken: any; controllerCap: any; object: any; message_code: any; message: any; geolocation: any; link: any }) {
  const { creditToken, controllerCap, object, message_code, message, geolocation, link } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::message";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.u16(message_code),
      tx.pure.string(message),
      tx.pure.string(geolocation),
      tx.pure.string(link),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}
