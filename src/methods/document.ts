import { Transaction } from "@iota/iota-sdk/transactions";
import { signAndExecute } from "../tx";
import { asJsonString } from "../env";
import type { ObjectIdApi } from "../api";
import { ensureTrailingSlashForOriginOnly } from "../utils/url";

export async function add_approver_did(api: ObjectIdApi, params: { controllerCap: any; document: any; new_approver_did: any }) {
  const { controllerCap, document, new_approver_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_approver_did";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.string(new_approver_did)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function add_document_credit(api: ObjectIdApi, params: { creditToken: any; document: any }) {
  const { creditToken, document } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_document_credit";

  tx.moveCall({
    arguments: [
      tx.object(creditToken), tx.object(env.policy), tx.object(document)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function add_editors_did(api: ObjectIdApi, params: { controllerCap: any; document: any; new_editor_did: any }) {
  const { controllerCap, document, new_editor_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_editors_did";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.string(new_editor_did)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function append_change_log(api: ObjectIdApi, params: { document: any; actor: any; op_desc: any; params: any }) {
  const { document, actor, op_desc, params: change_params } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::append_change_log";

  tx.moveCall({
    arguments: [
      tx.object(document),
      tx.pure.string(actor),
      tx.pure.string(op_desc),
      tx.pure.string(change_params),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function approve_document(api: ObjectIdApi, params: { controllerCap: any; document: any; new_approval_flag: any }) {
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

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function create_document(api: ObjectIdApi, params: { creditToken: any; OIDcontrollerCap: any; document_url: any; description: any; immutable_metadata: any; mutable_metadata: any }) {
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
      tx.pure.string(safeDocumentUrl),
      tx.pure.string(description),
      tx.pure.string(asJsonString(immutable_metadata)),
      tx.pure.string(asJsonString(mutable_metadata)),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function delete_document(api: ObjectIdApi, params: { controllerCap: any; document: any }) {
  const { controllerCap, document } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::delete_document";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function remove_approver_did(api: ObjectIdApi, params: { controllerCap: any; document: any; approver_did: any }) {
  const { controllerCap, document, approver_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::remove_approver_did";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.string(approver_did)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function remove_editors_did(api: ObjectIdApi, params: { controllerCap: any; document: any; editor_did: any }) {
  const { controllerCap, document, editor_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::remove_editors_did";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.string(editor_did)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_document_mutable_metadata(api: ObjectIdApi, params: { controllerCap: any; document: any; new_mutable_metadata: any }) {
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

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_document_owner_did(api: ObjectIdApi, params: { controllerCap: any; document: any; new_owner_did: any }) {
  const { controllerCap, document, new_owner_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_owner_did";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.string(new_owner_did)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_document_status(api: ObjectIdApi, params: { controllerCap: any; document: any; new_status: any }) {
  const { controllerCap, document, new_status } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_status";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.u8(Number(new_status)), tx.object("0x6")
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_document_url(api: ObjectIdApi, params: { controllerCap: any; document: any; new_document_url: any }) {
  const { controllerCap, document, new_document_url } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const safeUrl = ensureTrailingSlashForOriginOnly(new_document_url);

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_url";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.string(safeUrl), tx.object("0x6")
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_document_url_hash(api: ObjectIdApi, params: { controllerCap: any; document: any; new_hash: any; new_document_url: any }) {
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
      tx.pure.string(new_hash),
      tx.pure.string(safeUrl),
      tx.object("0x6"),
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}

export async function update_publisher_did(api: ObjectIdApi, params: { controllerCap: any; document: any; new_publisher_did: any }) {
  const { controllerCap, document, new_publisher_did } = params;
  const env = await api.env();
  const gasBudget = api.gasBudget;

  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_publisher_did";

  tx.moveCall({
    arguments: [
      tx.object(controllerCap), tx.object(document), tx.pure.string(new_publisher_did)
    ],
    target: moveFunction,
  });

  tx.setGasBudget(10_000_000);
  tx.setSender(env.sender);

  const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation, onExecuted: (api as any).onTxExecuted });
  return r;
}
