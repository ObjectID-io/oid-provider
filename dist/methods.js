import { Transaction } from "@iota/iota-sdk/transactions";
import { signAndExecute } from "./tx";
import { asJsonString } from "./env";
export async function add_approver_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function add_document_credit(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function add_editors_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function alert_message(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function anonymous_message(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function append_change_log(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function approve_document(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function control_message(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function counter_set_value(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function counter_stepdown(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function counter_stepup(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function create_component(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function create_counter(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function create_document(api, params) {
    const { creditToken, OIDcontrollerCap, document_url, description, immutable_metadata, mutable_metadata } = params;
    const env = await api.env();
    const gasBudget = api.gasBudget;
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
            tx.object("0x6"),
        ],
        target: moveFunction,
    });
    tx.setGasBudget(10_000_000);
    tx.setSender(env.sender);
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function create_event(api, params) {
    const { creditToken, controllerCap, object, event_type, immutable_metadata, mutable_metadata } = params;
    const env = await api.env();
    const gasBudget = api.gasBudget;
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
            tx.pure.string(mutable_metadata),
        ],
        target: moveFunction,
    });
    tx.setGasBudget(10_000_000);
    tx.setSender(env.sender);
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function create_object(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    if (r.success)
        r.createdObjectId = r.txEffect?.effects?.created?.[0]?.reference?.objectId;
    return r;
}
export async function creator_message(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function delete_component(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function delete_counter(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function delete_document(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function delete_event(api, params) {
    const { creditToken, controllerCap, object, event } = params;
    const env = await api.env();
    const gasBudget = api.gasBudget;
    const tx = new Transaction();
    const moveFunction = env.packageID + "::oid_object::delete_event";
    tx.moveCall({
        arguments: [
            tx.object(creditToken),
            tx.object(env.policy),
            tx.object(controllerCap),
            tx.object(object),
            tx.object(event),
        ],
        target: moveFunction,
    });
    tx.setGasBudget(10_000_000);
    tx.setSender(env.sender);
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function delete_object(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function message(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function remove_approver_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function remove_editors_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_agent_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_document_mutable_metadata(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_document_owner_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_document_status(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_document_url(api, params) {
    const { controllerCap, document, new_document_url } = params;
    const env = await api.env();
    const gasBudget = api.gasBudget;
    const tx = new Transaction();
    const moveFunction = env.documentPackageID + "::oid_document::update_document_url";
    tx.moveCall({
        arguments: [
            tx.object(controllerCap), tx.object(document), tx.pure.string(new_document_url), tx.object("0x6")
        ],
        target: moveFunction,
    });
    tx.setGasBudget(10_000_000);
    tx.setSender(env.sender);
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_document_url_hash(api, params) {
    const { controllerCap, document, new_hash, new_document_url } = params;
    const env = await api.env();
    const gasBudget = api.gasBudget;
    const tx = new Transaction();
    const moveFunction = env.documentPackageID + "::oid_document::update_document_url_hash";
    tx.moveCall({
        arguments: [
            tx.object(controllerCap),
            tx.object(document),
            tx.pure.string(new_hash),
            tx.pure.string(new_document_url),
            tx.object("0x6"),
        ],
        target: moveFunction,
    });
    tx.setGasBudget(10_000_000);
    tx.setSender(env.sender);
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_event_mutable_metadata(api, params) {
    const { creditToken, controllerCap, event, new_mutable_metadata } = params;
    const env = await api.env();
    const gasBudget = api.gasBudget;
    const tx = new Transaction();
    const moveFunction = env.packageID + "::oid_object::update_event_mutable_metadata";
    tx.moveCall({
        arguments: [
            tx.object(creditToken),
            tx.object(env.policy),
            tx.object(controllerCap),
            tx.object(event),
            tx.pure.string(new_mutable_metadata),
        ],
        target: moveFunction,
    });
    tx.setGasBudget(10_000_000);
    tx.setSender(env.sender);
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_geo_location(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_geolocation(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_object(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_object_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_object_mutable_metadata(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_op_code(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_owner_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
export async function update_publisher_did(api, params) {
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
    const r = await signAndExecute(env.client, env.keyPair, tx, { network: env.network, gasBudget, useGasStation: api.useGasStation, gasStation: api.gasStation });
    return r;
}
//# sourceMappingURL=methods.js.map