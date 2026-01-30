import { Transaction } from "@iota/iota-sdk/transactions";

import type { ObjectIdApi } from "../api";
import { asJsonString } from "../env";
import { signAndExecute } from "../utils/tx";
import { ensureTrailingSlashForOriginOnly } from "../utils/url";
import type { DidString, JsonInput, ObjectIdString, U8Input, UrlString } from "../types/types";

export type AddApproverDidParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_approver_did: DidString;
};

export async function add_approver_did(api: ObjectIdApi, params: AddApproverDidParams) {
  const { controllerCap, document, new_approver_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_approver_did";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(String(new_approver_did ?? ""))],
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

export type AddDocumentCreditParams = {
  creditToken: ObjectIdString;
  document: ObjectIdString;
};

export async function add_document_credit(api: ObjectIdApi, params: AddDocumentCreditParams) {
  const { creditToken, document } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_document_credit";

  tx.moveCall({
    arguments: [tx.object(creditToken), tx.object(env.policy), tx.object(document)],
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

export type AddEditorsDidParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_editor_did: DidString;
};

export async function add_editors_did(api: ObjectIdApi, params: AddEditorsDidParams) {
  const { controllerCap, document, new_editor_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_editors_did";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(String(new_editor_did ?? ""))],
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

export type AppendChangeLogParams = {
  document: ObjectIdString;
  actor: string;
  op_desc: string;
  params: JsonInput;
};

export async function append_change_log(api: ObjectIdApi, params: AppendChangeLogParams) {
  const { document, actor, op_desc, params: change_params } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::append_change_log";

  tx.moveCall({
    arguments: [
      tx.object(document),
      tx.pure.string(String(actor ?? "")),
      tx.pure.string(String(op_desc ?? "")),
      tx.pure.string(asJsonString(change_params)),
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

export type ApproveDocumentParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_approval_flag: U8Input;
};

export async function approve_document(api: ObjectIdApi, params: ApproveDocumentParams) {
  const { controllerCap, document, new_approval_flag } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::approve_document";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap),
      tx.object(document),
      tx.pure.u8(Number(new_approval_flag)),
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

export type CreateDocumentParams = {
  creditToken: ObjectIdString;
  OIDcontrollerCap: ObjectIdString;
  document_url: UrlString;
  description: string;
  immutable_metadata: JsonInput;
  mutable_metadata: JsonInput;
};

export async function create_document(api: ObjectIdApi, params: CreateDocumentParams) {
  const { creditToken, OIDcontrollerCap, document_url, description, immutable_metadata, mutable_metadata } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const safeDocumentUrl = ensureTrailingSlashForOriginOnly(document_url);

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::create_document";

  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(OIDcontrollerCap),
      tx.pure.string(String(safeDocumentUrl ?? "")),
      tx.pure.string(String(description ?? "")),
      tx.pure.string(asJsonString(immutable_metadata)),
      tx.pure.string(asJsonString(mutable_metadata)),
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

export type DeleteDocumentParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
};

export async function delete_document(api: ObjectIdApi, params: DeleteDocumentParams) {
  const { controllerCap, document } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::delete_document";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document)],
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

export type RemoveApproverDidParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  approver_did: DidString;
};

export async function remove_approver_did(api: ObjectIdApi, params: RemoveApproverDidParams) {
  const { controllerCap, document, approver_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::remove_approver_did";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(String(approver_did ?? ""))],
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

export type RemoveEditorsDidParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  editor_did: DidString;
};

export async function remove_editors_did(api: ObjectIdApi, params: RemoveEditorsDidParams) {
  const { controllerCap, document, editor_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::remove_editors_did";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(String(editor_did ?? ""))],
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

export type UpdateDocumentMutableMetadataParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_mutable_metadata: JsonInput;
};

export async function update_document_mutable_metadata(
  api: ObjectIdApi,
  params: UpdateDocumentMutableMetadataParams,
) {
  const { controllerCap, document, new_mutable_metadata } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_mutable_metadata";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap),
      tx.object(document),
      tx.pure.string(asJsonString(new_mutable_metadata)),
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

export type UpdateDocumentOwnerDidParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_owner_did: DidString;
};

export async function update_document_owner_did(api: ObjectIdApi, params: UpdateDocumentOwnerDidParams) {
  const { controllerCap, document, new_owner_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_owner_did";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(String(new_owner_did ?? ""))],
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

export type UpdateDocumentStatusParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_status: U8Input;
};

export async function update_document_status(api: ObjectIdApi, params: UpdateDocumentStatusParams) {
  const { controllerCap, document, new_status } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_status";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.u8(Number(new_status)), tx.object("0x6")],
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

export type UpdateDocumentUrlHashParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_hash: string;
  new_document_url: UrlString;
};

export async function update_document_url_hash(api: ObjectIdApi, params: UpdateDocumentUrlHashParams) {
  const { controllerCap, document, new_hash, new_document_url } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const safeUrl = ensureTrailingSlashForOriginOnly(new_document_url);

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_url_hash";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap),
      tx.object(document),
      tx.pure.string(String(new_hash ?? "")),
      tx.pure.string(String(safeUrl ?? "")),
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

export type UpdatePublisherDidParams = {
  controllerCap: ObjectIdString;
  document: ObjectIdString;
  new_publisher_did: DidString;
};

export async function update_publisher_did(api: ObjectIdApi, params: UpdatePublisherDidParams) {
  const { controllerCap, document, new_publisher_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_publisher_did";

  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(String(new_publisher_did ?? ""))],
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
