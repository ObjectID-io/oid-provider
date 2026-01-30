import { Transaction } from "@iota/iota-sdk/transactions";
import { IOTA_CLOCK_OBJECT_ID } from "@iota/iota-sdk/utils";

import type { ObjectIdApi } from "../api";
import { asJsonString } from "../env";
import { signAndExecute } from "../utils/tx";
import { ensureTrailingSlashForOriginOnly } from "../utils/url";
import type { JsonInput, ObjectIdString, UrlString } from "../types/types";

export type CreateObjectParams = {
  creditToken: ObjectIdString;
  OIDcontrollerCap: ObjectIdString;
  object_type: string;
  product_url: UrlString;
  product_img_url: UrlString;
  description: string;
  op_code: string;
  immutable_metadata: JsonInput;
  mutable_metadata: JsonInput;
  /** Open Location Code (plus code) or other string accepted by the Move module */
  geo_location: string;
};

export async function create_object(api: ObjectIdApi, params: CreateObjectParams) {
  const {
    creditToken,
    OIDcontrollerCap,
    object_type,
    product_url,
    product_img_url,
    description,
    op_code,
    immutable_metadata,
    mutable_metadata,
    geo_location,
  } = params;

  const env = await api.env();
  const gasBudget = api.gasBudget;

  // IMPORTANT: Move checks prefixes using std::string::substring with the on-chain linked_domain length.
  // If the client passes a bare URL origin like "https://example.com" while linked_domain is stored as
  // "https://example.com/", substring will abort with out-of-bounds.
  const safeProductUrl = ensureTrailingSlashForOriginOnly(product_url);

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::create_object";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(OIDcontrollerCap),
      tx.pure.string(String(object_type ?? "")),
      tx.pure.string(String(safeProductUrl ?? "")),
      tx.pure.string(String(product_img_url ?? "")),
      tx.pure.string(String(description ?? "")),
      tx.pure.string(String(op_code ?? "")),
      tx.pure.string(asJsonString(immutable_metadata)),
      tx.pure.string(asJsonString(mutable_metadata)),
      tx.pure.string(String(geo_location ?? "")),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r: any = await signAndExecute(env.client, env.keyPair, tx, {
    network: env.network,
    gasBudget,
    useGasStation: api.useGasStation,
    gasStation: api.gasStation,
    onExecuted: (api as any).onTxExecuted,
  });

  if (r?.success) r.createdObjectId = r.txEffect?.effects?.created?.[0]?.reference?.objectId;
  return r;
}

export type DeleteObjectParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
};

export async function delete_object(api: ObjectIdApi, params: DeleteObjectParams) {
  const { creditToken, controllerCap, object } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_object";

  tx.moveCall({
    arguments: [tx.object(creditToken), tx.object(env.policy), tx.object(controllerCap), tx.object(object)],
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

export type UpdateAgentDidParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  new_agent_did: string;
};

export async function update_agent_did(api: ObjectIdApi, params: UpdateAgentDidParams) {
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
      tx.pure.string(String(new_agent_did ?? "")),
      tx.object("0x6"),
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

export type UpdateGeoLocationParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  new_location: string;
};

export async function update_geo_location(api: ObjectIdApi, params: UpdateGeoLocationParams) {
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
      tx.pure.string(String(new_location ?? "")),
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

// Back-compat alias (same Move target)
export async function update_geolocation(api: ObjectIdApi, params: UpdateGeoLocationParams) {
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
      tx.pure.string(String(new_location ?? "")),
      tx.object("0x6"),
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

export type UpdateObjectParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  new_product_img_url: UrlString;
  new_description: string;
};

export async function update_object(api: ObjectIdApi, params: UpdateObjectParams) {
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
      tx.pure.string(String(new_product_img_url ?? "")),
      tx.pure.string(String(new_description ?? "")),
      tx.object("0x6"),
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

export type UpdateObjectDidParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  new_object_did: string;
};

export async function update_object_did(api: ObjectIdApi, params: UpdateObjectDidParams) {
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
      tx.pure.string(String(new_object_did ?? "")),
      tx.object("0x6"),
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

export type UpdateObjectMutableMetadataParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  new_mutable_metadata: JsonInput;
};

export async function update_object_mutable_metadata(api: ObjectIdApi, params: UpdateObjectMutableMetadataParams) {
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
      tx.pure.string(asJsonString(new_mutable_metadata)),
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

export type UpdateOpCodeParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  new_op_code: string;
};

export async function update_op_code(api: ObjectIdApi, params: UpdateOpCodeParams) {
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
      tx.pure.string(String(new_op_code ?? "")),
      tx.object("0x6"),
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

export type UpdateOwnerDidParams = {
  creditToken: ObjectIdString;
  controllerCap: ObjectIdString;
  object: ObjectIdString;
  new_owner_did: string;
};

export async function update_owner_did(api: ObjectIdApi, params: UpdateOwnerDidParams) {
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
      tx.pure.string(String(new_owner_did ?? "")),
      tx.object("0x6"),
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
