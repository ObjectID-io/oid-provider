import { Transaction } from "@iota/iota-sdk/transactions";

import type { ObjectIdApi } from "../api";
import { signAndExecute } from "../utils/tx";
import type { ObjectIdString, U16Input } from "../types/types";

export type MessageParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  message: string;
  message_code: U16Input;
  geolocation: string;
  link: string;
};

export async function alert_message(api: ObjectIdApi, params: MessageParams) {
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
      tx.pure.string(String(message ?? "")),
      tx.pure.u16(Number(message_code)),
      tx.pure.string(String(geolocation ?? "")),
      tx.pure.string(String(link ?? "")),
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

export type AnonymousMessageParams = {
  object: ObjectIdString;
  geolocation: string;
};

export async function anonymous_message(api: ObjectIdApi, params: AnonymousMessageParams) {
  const { object, geolocation } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::anonymous_message";

  tx.moveCall({
    arguments: [tx.object(object), tx.pure.string(String(geolocation ?? ""))],
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

export async function control_message(api: ObjectIdApi, params: MessageParams) {
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
      tx.pure.string(String(message ?? "")),
      tx.pure.u16(Number(message_code)),
      tx.pure.string(String(geolocation ?? "")),
      tx.pure.string(String(link ?? "")),
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

export async function creator_message(api: ObjectIdApi, params: MessageParams) {
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
      tx.pure.string(String(message ?? "")),
      tx.pure.u16(Number(message_code)),
      tx.pure.string(String(geolocation ?? "")),
      tx.pure.string(String(link ?? "")),
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

export type GenericMessageParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  message_code: U16Input;
  message: string;
  geolocation: string;
  link: string;
};

export async function message(api: ObjectIdApi, params: GenericMessageParams) {
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
      tx.pure.u16(Number(message_code)),
      tx.pure.string(String(message ?? "")),
      tx.pure.string(String(geolocation ?? "")),
      tx.pure.string(String(link ?? "")),
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
