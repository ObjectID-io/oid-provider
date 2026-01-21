import { resolveEnv } from "./env";
import { searchObjectsByType } from "./graphql";
import { getObject } from "./utils/getObject";
import * as methods from "./methods";
export function createObjectIdApi(cfg) {
    let _envPromise = null;
    const gasBudget = cfg.gasBudget ?? 10_000_000;
    const useGasStation = !!cfg.useGasStation;
    const gasStation = cfg.gasStation;
    async function env() {
        if (!_envPromise)
            _envPromise = resolveEnv(cfg);
        return _envPromise;
    }
    const apiRef = {
        env,
        gasBudget,
        useGasStation,
        gasStation,
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
        add_approver_did: (params) => methods.add_approver_did(apiRef, params),
        add_document_credit: (params) => methods.add_document_credit(apiRef, params),
        add_editors_did: (params) => methods.add_editors_did(apiRef, params),
        alert_message: (params) => methods.alert_message(apiRef, params),
        anonymous_message: (params) => methods.anonymous_message(apiRef, params),
        append_change_log: (params) => methods.append_change_log(apiRef, params),
        approve_document: (params) => methods.approve_document(apiRef, params),
        control_message: (params) => methods.control_message(apiRef, params),
        counter_set_value: (params) => methods.counter_set_value(apiRef, params),
        counter_stepdown: (params) => methods.counter_stepdown(apiRef, params),
        counter_stepup: (params) => methods.counter_stepup(apiRef, params),
        create_component: (params) => methods.create_component(apiRef, params),
        create_counter: (params) => methods.create_counter(apiRef, params),
        create_document: (params) => methods.create_document(apiRef, params),
        create_event: (params) => methods.create_event(apiRef, params),
        create_object: (params) => methods.create_object(apiRef, params),
        creator_message: (params) => methods.creator_message(apiRef, params),
        delete_component: (params) => methods.delete_component(apiRef, params),
        delete_counter: (params) => methods.delete_counter(apiRef, params),
        delete_document: (params) => methods.delete_document(apiRef, params),
        delete_event: (params) => methods.delete_event(apiRef, params),
        delete_object: (params) => methods.delete_object(apiRef, params),
        message: (params) => methods.message(apiRef, params),
        remove_approver_did: (params) => methods.remove_approver_did(apiRef, params),
        remove_editors_did: (params) => methods.remove_editors_did(apiRef, params),
        update_agent_did: (params) => methods.update_agent_did(apiRef, params),
        update_document_mutable_metadata: (params) => methods.update_document_mutable_metadata(apiRef, params),
        update_document_owner_did: (params) => methods.update_document_owner_did(apiRef, params),
        update_document_status: (params) => methods.update_document_status(apiRef, params),
        update_document_url: (params) => methods.update_document_url(apiRef, params),
        update_document_url_hash: (params) => methods.update_document_url_hash(apiRef, params),
        update_event_mutable_metadata: (params) => methods.update_event_mutable_metadata(apiRef, params),
        update_geo_location: (params) => methods.update_geo_location(apiRef, params),
        update_geolocation: (params) => methods.update_geolocation(apiRef, params),
        update_object: (params) => methods.update_object(apiRef, params),
        update_object_did: (params) => methods.update_object_did(apiRef, params),
        update_object_mutable_metadata: (params) => methods.update_object_mutable_metadata(apiRef, params),
        update_op_code: (params) => methods.update_op_code(apiRef, params),
        update_owner_did: (params) => methods.update_owner_did(apiRef, params),
        update_publisher_did: (params) => methods.update_publisher_did(apiRef, params),
    };
    return apiRef;
}
//# sourceMappingURL=api.js.map