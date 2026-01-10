import { IotaClient, getFullnodeUrl } from '@iota/iota-sdk/client';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { Transaction } from '@iota/iota-sdk/transactions';

// src/env.ts

// src/graphql.ts
async function searchObjectsByType(type, after, graphqlProvider) {
  const query = `
  query ($type: String!, $after: String) {
    objects(filter: { type: $type }, after: $after) {
      edges {
        cursor
        node {
          address
          asMoveObject {
            contents {
              type { repr }
              data
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`;
  const resp = await fetch(graphqlProvider, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { type, after } })
  });
  const json = await resp.json();
  if (!resp.ok) throw Object.assign(new Error(`GraphQL HTTP ${resp.status}`), { status: resp.status, json });
  if (json.errors) throw Object.assign(new Error("GraphQL errors"), { errors: json.errors });
  const edges = json?.data?.objects?.edges;
  if (!edges) throw new Error("No data returned from the GraphQL query.");
  return edges;
}

// src/env.ts
var DEFAULTS = {
  testnet: {
    packageID: "0x79857c1738f31d70165149678ae051d5bffbaa26dbb66a25ad835e09f2180ae5",
    documentPackageID: "0x6e884a623d5661fca38cf9601cbc9fb85fa1d5aaff28a1fe96d260437b971ba7",
    graphqlProvider: "https://graphql.testnet.iota.cafe/"
  },
  mainnet: {
    packageID: "0xc6b77b8ab151fda5c98b544bda1f769e259146dc4388324e6737ecb9ab1a7465",
    documentPackageID: "0x23ba3cf060ea3fbb53542e1a3347ee1eb215913081fecdf1eda462c3101da556",
    graphqlProvider: "https://graphql.mainnet.iota.cafe/"
  }
};
function asJsonString(v) {
  if (v === void 0 || v === null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
async function resolveEnv(cfg) {
  const net = String(cfg.network);
  const d = net === "mainnet" ? DEFAULTS.mainnet : DEFAULTS.testnet;
  const packageID = cfg.packageID ?? d.packageID;
  const documentPackageID = cfg.documentPackageID ?? d.documentPackageID;
  const graphqlProvider = cfg.graphqlProvider ?? d.graphqlProvider;
  const client = new IotaClient({ url: getFullnodeUrl(net) });
  const keyPair = Ed25519Keypair.deriveKeypairFromSeed(cfg.seed);
  const sender = keyPair.toIotaAddress();
  const tokenCreditType = `0x2::token::Token<${packageID}::oid_credit::OID_CREDIT>`;
  const policyTokenType = `0x2::token::TokenPolicy<${packageID}::oid_credit::OID_CREDIT>`;
  const OIDobjectType = `${packageID}::oid_object::OIDObject`;
  const pedges = await searchObjectsByType(policyTokenType, null, graphqlProvider);
  const policy = pedges[0]?.node?.address;
  if (!policy) throw new Error("Policy object not found via GraphQL.");
  return {
    client,
    keyPair,
    sender,
    network: net,
    graphqlProvider,
    packageID,
    documentPackageID,
    policy,
    tokenCreditType,
    policyTokenType,
    OIDobjectType
  };
}

// src/getObject.ts
async function getObject(client, id) {
  if (!id) return {};
  const { data } = await client.getObject({
    id,
    options: {
      showType: true,
      showOwner: false,
      showPreviousTransaction: false,
      showDisplay: true,
      showContent: true,
      showBcs: true,
      showStorageRebate: false
    }
  });
  return data;
}

// src/tx.ts
async function signAndExecute(client, keyPair, tx) {
  try {
    const result = await client.signAndExecuteTransaction({
      signer: keyPair,
      transaction: tx
    });
    const txEffect = await client.waitForTransaction({
      digest: result.digest,
      options: { showEffects: true }
    });
    const status = txEffect.effects?.status;
    const ok = status?.status === "success";
    return {
      success: !!ok,
      txDigest: txEffect.digest,
      status,
      error: ok ? void 0 : status?.error,
      txEffect
    };
  } catch (error) {
    return { success: false, error };
  }
}

// src/methods.ts
async function add_approver_did(api, params) {
  const { controllerCap, document, new_approver_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_approver_did";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(new_approver_did)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function add_document_credit(api, params) {
  const { creditToken, document } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_document_credit";
  tx.moveCall({
    arguments: [tx.object(creditToken), tx.object(env.policy), tx.object(document)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function add_editors_did(api, params) {
  const { controllerCap, document, new_editor_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::add_editors_did";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(new_editor_did)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function alert_message(api, params) {
  const { creditToken, controllerCap, object, message: message2, message_code, geolocation, link } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::alert_message";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(message2),
      tx.pure.u16(message_code),
      tx.pure.string(geolocation),
      tx.pure.string(link)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function anonymous_message(api, params) {
  const { object, geolocation } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::anonymous_message";
  tx.moveCall({
    arguments: [tx.object(object), tx.pure.string(geolocation)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function append_change_log(api, params) {
  const { document, actor, op_desc, params: change_params } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::append_change_log";
  tx.moveCall({
    arguments: [
      tx.object(document),
      tx.pure.string(actor),
      tx.pure.string(op_desc),
      tx.pure.string(change_params),
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function approve_document(api, params) {
  const { controllerCap, document, new_approval_flag } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::approve_document";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.u8(Number(new_approval_flag)), tx.object("0x6")],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function control_message(api, params) {
  const { creditToken, controllerCap, object, message: message2, message_code, geolocation, link } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::control_message";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(message2),
      tx.pure.u16(message_code),
      tx.pure.string(geolocation),
      tx.pure.string(link)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function counter_set_value(api, params) {
  const { creditToken, controllerCap, objectId, counter, new_value } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::counter_set_value";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(objectId),
      tx.object(counter),
      tx.pure.u64(new_value)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function counter_stepdown(api, params) {
  const { creditToken, controllerCap, objectId, counter } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::counter_stepdown";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(objectId),
      tx.object(counter)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function counter_stepup(api, params) {
  const { creditToken, controllerCap, object, counter } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::counter_stepup";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(counter)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function create_component(api, params) {
  const { creditToken, controllerCap, object, component_id, description } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::create_component";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.address(component_id),
      tx.pure.string(description)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function create_counter(api, params) {
  const { creditToken, controllerCap, object, value, unit, step, immutable_metadata, mutable_metadata } = params;
  const env = await api.env();
  api.gasBudget;
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
      tx.pure.string(mutable_metadata)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function create_document(api, params) {
  const { creditToken, OIDcontrollerCap, document_url, description, immutable_metadata, mutable_metadata } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::create_document";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(OIDcontrollerCap),
      tx.pure.string(document_url),
      tx.pure.string(description),
      tx.pure.string(asJsonString(immutable_metadata)),
      tx.pure.string(asJsonString(mutable_metadata)),
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function create_event(api, params) {
  const { creditToken, controllerCap, object, event_type, immutable_metadata, mutable_metadata } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::create_event";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.pure.address(object),
      tx.pure.string(event_type),
      tx.pure.string(immutable_metadata),
      tx.pure.string(mutable_metadata)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function create_object(api, params) {
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
    geo_location
  } = params;
  const env = await api.env();
  api.gasBudget;
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
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  if (r.success) r.createdObjectId = r.txEffect?.effects?.created?.[0]?.reference?.objectId;
  return r;
}
async function creator_message(api, params) {
  const { creditToken, controllerCap, object, message: message2, message_code, geolocation, link } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::creator_message";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(message2),
      tx.pure.u16(message_code),
      tx.pure.string(geolocation),
      tx.pure.string(link)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function delete_component(api, params) {
  const { creditToken, controllerCap, object, component } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_component";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(component)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function delete_counter(api, params) {
  const { creditToken, controllerCap, object, counter } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_counter";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(counter)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function delete_document(api, params) {
  const { controllerCap, document } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::delete_document";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function delete_event(api, params) {
  const { creditToken, controllerCap, object, event } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_event";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.object(event)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function delete_object(api, params) {
  const { creditToken, controllerCap, object } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::delete_object";
  tx.moveCall({
    arguments: [tx.object(creditToken), tx.object(env.policy), tx.object(controllerCap), tx.object(object)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function message(api, params) {
  const { creditToken, controllerCap, object, message_code, message: message2, geolocation, link } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::message";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.u16(message_code),
      tx.pure.string(message2),
      tx.pure.string(geolocation),
      tx.pure.string(link)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function remove_approver_did(api, params) {
  const { controllerCap, document, approver_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::remove_approver_did";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(approver_did)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function remove_editors_did(api, params) {
  const { controllerCap, document, editor_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::remove_editors_did";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(editor_did)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_agent_did(api, params) {
  const { creditToken, controllerCap, object, new_agent_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_agent_did";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_agent_did)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_document_mutable_metadata(api, params) {
  const { controllerCap, document, new_mutable_metadata } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_mutable_metadata";
  tx.moveCall({
    arguments: [
      tx.object(controllerCap),
      tx.object(document),
      tx.pure.string(asJsonString(new_mutable_metadata)),
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_document_owner_did(api, params) {
  const { controllerCap, document, new_owner_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_owner_did";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(new_owner_did)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_document_status(api, params) {
  const { controllerCap, document, new_status } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_status";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.u8(Number(new_status)), tx.object("0x6")],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_document_url(api, params) {
  const { controllerCap, document, new_document_url } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_url";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(new_document_url), tx.object("0x6")],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_document_url_hash(api, params) {
  const { controllerCap, document, new_hash, new_document_url } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_document_url_hash";
  tx.moveCall({
    arguments: [
      tx.object(controllerCap),
      tx.object(document),
      tx.pure.string(new_hash),
      tx.pure.string(new_document_url),
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_event_mutable_metadata(api, params) {
  const { creditToken, controllerCap, event, new_mutable_metadata } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_event_mutable_metadata";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(event),
      tx.pure.string(new_mutable_metadata)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_geo_location(api, params) {
  const { creditToken, controllerCap, object, new_location } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_geo_location";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_location)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_geolocation(api, params) {
  const { creditToken, controllerCap, object, new_location } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_geolocation";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_location),
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_object(api, params) {
  const { creditToken, controllerCap, object, new_product_img_url, new_description } = params;
  const env = await api.env();
  api.gasBudget;
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
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_object_did(api, params) {
  const { creditToken, controllerCap, object, new_object_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_object_did";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_object_did),
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_object_mutable_metadata(api, params) {
  const { creditToken, controllerCap, object, new_mutable_metadata } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_object_mutable_metadata";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_mutable_metadata)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_op_code(api, params) {
  const { creditToken, controllerCap, object, new_op_code } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_op_code";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_op_code),
      tx.object("0x6")
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_owner_did(api, params) {
  const { creditToken, controllerCap, object, new_owner_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.packageID + "::oid_object::update_owner_did";
  tx.moveCall({
    arguments: [
      tx.object(creditToken),
      tx.object(env.policy),
      tx.object(controllerCap),
      tx.object(object),
      tx.pure.string(new_owner_did)
    ],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}
async function update_publisher_did(api, params) {
  const { controllerCap, document, new_publisher_did } = params;
  const env = await api.env();
  api.gasBudget;
  const tx = new Transaction();
  const moveFunction = env.documentPackageID + "::oid_document::update_publisher_did";
  tx.moveCall({
    arguments: [tx.object(controllerCap), tx.object(document), tx.pure.string(new_publisher_did)],
    target: moveFunction
  });
  tx.setGasBudget(1e7);
  tx.setSender(env.sender);
  const r = await signAndExecute(env.client, env.keyPair, tx);
  return r;
}

// src/api.ts
function createObjectIdApi(cfg) {
  let _envPromise = null;
  const gasBudget = cfg.gasBudget ?? 1e7;
  async function env() {
    if (!_envPromise) _envPromise = resolveEnv(cfg);
    return _envPromise;
  }
  const apiRef = {
    env,
    gasBudget,
    async get_object({ objectId }) {
      const e = await env();
      return getObject(e.client, objectId);
    },
    async get_objects({ after = null }) {
      const e = await env();
      return searchObjectsByType(e.OIDobjectType, after, e.graphqlProvider);
    },
    document_did_string({ id }) {
      const raw = String(id || "").trim();
      const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
      return "did:iota:0x" + hex.toLowerCase();
    },
    // Tx methods below
    add_approver_did: (params) => add_approver_did(apiRef, params),
    add_document_credit: (params) => add_document_credit(apiRef, params),
    add_editors_did: (params) => add_editors_did(apiRef, params),
    alert_message: (params) => alert_message(apiRef, params),
    anonymous_message: (params) => anonymous_message(apiRef, params),
    append_change_log: (params) => append_change_log(apiRef, params),
    approve_document: (params) => approve_document(apiRef, params),
    control_message: (params) => control_message(apiRef, params),
    counter_set_value: (params) => counter_set_value(apiRef, params),
    counter_stepdown: (params) => counter_stepdown(apiRef, params),
    counter_stepup: (params) => counter_stepup(apiRef, params),
    create_component: (params) => create_component(apiRef, params),
    create_counter: (params) => create_counter(apiRef, params),
    create_document: (params) => create_document(apiRef, params),
    create_event: (params) => create_event(apiRef, params),
    create_object: (params) => create_object(apiRef, params),
    creator_message: (params) => creator_message(apiRef, params),
    delete_component: (params) => delete_component(apiRef, params),
    delete_counter: (params) => delete_counter(apiRef, params),
    delete_document: (params) => delete_document(apiRef, params),
    delete_event: (params) => delete_event(apiRef, params),
    delete_object: (params) => delete_object(apiRef, params),
    message: (params) => message(apiRef, params),
    remove_approver_did: (params) => remove_approver_did(apiRef, params),
    remove_editors_did: (params) => remove_editors_did(apiRef, params),
    update_agent_did: (params) => update_agent_did(apiRef, params),
    update_document_mutable_metadata: (params) => update_document_mutable_metadata(apiRef, params),
    update_document_owner_did: (params) => update_document_owner_did(apiRef, params),
    update_document_status: (params) => update_document_status(apiRef, params),
    update_document_url: (params) => update_document_url(apiRef, params),
    update_document_url_hash: (params) => update_document_url_hash(apiRef, params),
    update_event_mutable_metadata: (params) => update_event_mutable_metadata(apiRef, params),
    update_geo_location: (params) => update_geo_location(apiRef, params),
    update_geolocation: (params) => update_geolocation(apiRef, params),
    update_object: (params) => update_object(apiRef, params),
    update_object_did: (params) => update_object_did(apiRef, params),
    update_object_mutable_metadata: (params) => update_object_mutable_metadata(apiRef, params),
    update_op_code: (params) => update_op_code(apiRef, params),
    update_owner_did: (params) => update_owner_did(apiRef, params),
    update_publisher_did: (params) => update_publisher_did(apiRef, params)
  };
  return apiRef;
}

export { createObjectIdApi };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map