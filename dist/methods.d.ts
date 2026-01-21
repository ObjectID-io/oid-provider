import type { ObjectIdApi } from "./api";
export declare function add_approver_did(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_approver_did: any;
}): Promise<import(".").TxExecResult>;
export declare function add_document_credit(api: ObjectIdApi, params: {
    creditToken: any;
    document: any;
}): Promise<import(".").TxExecResult>;
export declare function add_editors_did(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_editor_did: any;
}): Promise<import(".").TxExecResult>;
export declare function alert_message(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    message: any;
    message_code: any;
    geolocation: any;
    link: any;
}): Promise<import(".").TxExecResult>;
export declare function anonymous_message(api: ObjectIdApi, params: {
    object: any;
    geolocation: any;
}): Promise<import(".").TxExecResult>;
export declare function append_change_log(api: ObjectIdApi, params: {
    document: any;
    actor: any;
    op_desc: any;
    params: any;
}): Promise<import(".").TxExecResult>;
export declare function approve_document(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_approval_flag: any;
}): Promise<import(".").TxExecResult>;
export declare function control_message(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    message: any;
    message_code: any;
    geolocation: any;
    link: any;
}): Promise<import(".").TxExecResult>;
export declare function counter_set_value(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    objectId: any;
    counter: any;
    new_value: any;
}): Promise<import(".").TxExecResult>;
export declare function counter_stepdown(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    objectId: any;
    counter: any;
}): Promise<import(".").TxExecResult>;
export declare function counter_stepup(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    counter: any;
}): Promise<import(".").TxExecResult>;
export declare function create_component(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    component_id: any;
    description: any;
}): Promise<import(".").TxExecResult>;
export declare function create_counter(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    value: any;
    unit: any;
    step: any;
    immutable_metadata: any;
    mutable_metadata: any;
}): Promise<import(".").TxExecResult>;
export declare function create_document(api: ObjectIdApi, params: {
    creditToken: any;
    OIDcontrollerCap: any;
    document_url: any;
    description: any;
    immutable_metadata: any;
    mutable_metadata: any;
}): Promise<import(".").TxExecResult>;
export declare function create_event(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    event_type: any;
    immutable_metadata: any;
    mutable_metadata: any;
}): Promise<import(".").TxExecResult>;
export declare function create_object(api: ObjectIdApi, params: {
    creditToken: any;
    OIDcontrollerCap: any;
    object_type: any;
    product_url: any;
    product_img_url: any;
    description: any;
    op_code: any;
    immutable_metadata: any;
    mutable_metadata: any;
    geo_location: any;
}): Promise<import(".").TxExecResult>;
export declare function creator_message(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    message: any;
    message_code: any;
    geolocation: any;
    link: any;
}): Promise<import(".").TxExecResult>;
export declare function delete_component(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    component: any;
}): Promise<import(".").TxExecResult>;
export declare function delete_counter(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    counter: any;
}): Promise<import(".").TxExecResult>;
export declare function delete_document(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
}): Promise<import(".").TxExecResult>;
export declare function delete_event(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    event: any;
}): Promise<import(".").TxExecResult>;
export declare function delete_object(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
}): Promise<import(".").TxExecResult>;
export declare function message(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    message_code: any;
    message: any;
    geolocation: any;
    link: any;
}): Promise<import(".").TxExecResult>;
export declare function remove_approver_did(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    approver_did: any;
}): Promise<import(".").TxExecResult>;
export declare function remove_editors_did(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    editor_did: any;
}): Promise<import(".").TxExecResult>;
export declare function update_agent_did(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_agent_did: any;
}): Promise<import(".").TxExecResult>;
export declare function update_document_mutable_metadata(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_mutable_metadata: any;
}): Promise<import(".").TxExecResult>;
export declare function update_document_owner_did(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_owner_did: any;
}): Promise<import(".").TxExecResult>;
export declare function update_document_status(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_status: any;
}): Promise<import(".").TxExecResult>;
export declare function update_document_url(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_document_url: any;
}): Promise<import(".").TxExecResult>;
export declare function update_document_url_hash(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_hash: any;
    new_document_url: any;
}): Promise<import(".").TxExecResult>;
export declare function update_event_mutable_metadata(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    event: any;
    new_mutable_metadata: any;
}): Promise<import(".").TxExecResult>;
export declare function update_geo_location(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_location: any;
}): Promise<import(".").TxExecResult>;
export declare function update_geolocation(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_location: any;
}): Promise<import(".").TxExecResult>;
export declare function update_object(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_product_img_url: any;
    new_description: any;
}): Promise<import(".").TxExecResult>;
export declare function update_object_did(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_object_did: any;
}): Promise<import(".").TxExecResult>;
export declare function update_object_mutable_metadata(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_mutable_metadata: any;
}): Promise<import(".").TxExecResult>;
export declare function update_op_code(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_op_code: any;
}): Promise<import(".").TxExecResult>;
export declare function update_owner_did(api: ObjectIdApi, params: {
    creditToken: any;
    controllerCap: any;
    object: any;
    new_owner_did: any;
}): Promise<import(".").TxExecResult>;
export declare function update_publisher_did(api: ObjectIdApi, params: {
    controllerCap: any;
    document: any;
    new_publisher_did: any;
}): Promise<import(".").TxExecResult>;
//# sourceMappingURL=methods.d.ts.map