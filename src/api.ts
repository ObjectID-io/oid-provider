import type { ObjectIdProviderConfig, TxExecResult, ObjectEdge } from "./types";
import { resolveEnv, type ResolvedEnv } from "./env";
import { searchObjectsByType } from "./graphql";
import { getObject } from "./getObject";
import * as methods from "./methods";

export type ObjectIdApi = {
  env: () => Promise<ResolvedEnv>;
  gasBudget: number;
  useGasStation: boolean;
  gasStation?: import("./types").gasStationCfg;

  // Non-tx helpers:
  get_object: (params: { objectId: string }) => Promise<any>;
  get_objects: (params: { after?: string | null }) => Promise<ObjectEdge[]>;
  document_did_string: (params: { id: string }) => string;

  // Tx methods:
  add_approver_did: (params: any) => Promise<TxExecResult>;
  add_document_credit: (params: any) => Promise<TxExecResult>;
  add_editors_did: (params: any) => Promise<TxExecResult>;
  alert_message: (params: any) => Promise<TxExecResult>;
  anonymous_message: (params: any) => Promise<TxExecResult>;
  append_change_log: (params: any) => Promise<TxExecResult>;
  approve_document: (params: any) => Promise<TxExecResult>;
  control_message: (params: any) => Promise<TxExecResult>;
  counter_set_value: (params: any) => Promise<TxExecResult>;
  counter_stepdown: (params: any) => Promise<TxExecResult>;
  counter_stepup: (params: any) => Promise<TxExecResult>;
  create_component: (params: any) => Promise<TxExecResult>;
  create_counter: (params: any) => Promise<TxExecResult>;
  create_document: (params: any) => Promise<TxExecResult>;
  create_event: (params: any) => Promise<TxExecResult>;
  create_object: (params: any) => Promise<TxExecResult>;
  creator_message: (params: any) => Promise<TxExecResult>;
  delete_component: (params: any) => Promise<TxExecResult>;
  delete_counter: (params: any) => Promise<TxExecResult>;
  delete_document: (params: any) => Promise<TxExecResult>;
  delete_event: (params: any) => Promise<TxExecResult>;
  delete_object: (params: any) => Promise<TxExecResult>;
  message: (params: any) => Promise<TxExecResult>;
  remove_approver_did: (params: any) => Promise<TxExecResult>;
  remove_editors_did: (params: any) => Promise<TxExecResult>;
  update_agent_did: (params: any) => Promise<TxExecResult>;
  update_document_mutable_metadata: (params: any) => Promise<TxExecResult>;
  update_document_owner_did: (params: any) => Promise<TxExecResult>;
  update_document_status: (params: any) => Promise<TxExecResult>;
  update_document_url: (params: any) => Promise<TxExecResult>;
  update_document_url_hash: (params: any) => Promise<TxExecResult>;
  update_event_mutable_metadata: (params: any) => Promise<TxExecResult>;
  update_geo_location: (params: any) => Promise<TxExecResult>;
  update_geolocation: (params: any) => Promise<TxExecResult>;
  update_object: (params: any) => Promise<TxExecResult>;
  update_object_did: (params: any) => Promise<TxExecResult>;
  update_object_mutable_metadata: (params: any) => Promise<TxExecResult>;
  update_op_code: (params: any) => Promise<TxExecResult>;
  update_owner_did: (params: any) => Promise<TxExecResult>;
  update_publisher_did: (params: any) => Promise<TxExecResult>;
};

export function createObjectIdApi(cfg: ObjectIdProviderConfig): ObjectIdApi {
  let _envPromise: Promise<ResolvedEnv> | null = null;
  const gasBudget = cfg.gasBudget ?? 10_000_000;
  const useGasStation = !!cfg.useGasStation;
  const gasStation = cfg.gasStation;

  async function env(): Promise<ResolvedEnv> {
    if (!_envPromise) _envPromise = resolveEnv(cfg);
    return _envPromise;
  }

  const apiRef: any = {
    env,
    gasBudget,
    useGasStation,
    gasStation,

    async get_object({ objectId }: { objectId: string }) {
      const e = await env();
      return getObject(e.client, objectId);
    },

    async get_objects({ after = null }: { after?: string | null }) {
      const e = await env();
      return searchObjectsByType(e.OIDobjectType, after, e.graphqlProvider);
    },

    document_did_string({ id }: { id: string }) {
      const raw = String(id || "").trim();
      const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
      return "did:iota:0x" + hex.toLowerCase();
    },

    // Tx methods below
        add_approver_did: (params: any) => (methods as any).add_approver_did(apiRef, params),
    add_document_credit: (params: any) => (methods as any).add_document_credit(apiRef, params),
    add_editors_did: (params: any) => (methods as any).add_editors_did(apiRef, params),
    alert_message: (params: any) => (methods as any).alert_message(apiRef, params),
    anonymous_message: (params: any) => (methods as any).anonymous_message(apiRef, params),
    append_change_log: (params: any) => (methods as any).append_change_log(apiRef, params),
    approve_document: (params: any) => (methods as any).approve_document(apiRef, params),
    control_message: (params: any) => (methods as any).control_message(apiRef, params),
    counter_set_value: (params: any) => (methods as any).counter_set_value(apiRef, params),
    counter_stepdown: (params: any) => (methods as any).counter_stepdown(apiRef, params),
    counter_stepup: (params: any) => (methods as any).counter_stepup(apiRef, params),
    create_component: (params: any) => (methods as any).create_component(apiRef, params),
    create_counter: (params: any) => (methods as any).create_counter(apiRef, params),
    create_document: (params: any) => (methods as any).create_document(apiRef, params),
    create_event: (params: any) => (methods as any).create_event(apiRef, params),
    create_object: (params: any) => (methods as any).create_object(apiRef, params),
    creator_message: (params: any) => (methods as any).creator_message(apiRef, params),
    delete_component: (params: any) => (methods as any).delete_component(apiRef, params),
    delete_counter: (params: any) => (methods as any).delete_counter(apiRef, params),
    delete_document: (params: any) => (methods as any).delete_document(apiRef, params),
    delete_event: (params: any) => (methods as any).delete_event(apiRef, params),
    delete_object: (params: any) => (methods as any).delete_object(apiRef, params),
    message: (params: any) => (methods as any).message(apiRef, params),
    remove_approver_did: (params: any) => (methods as any).remove_approver_did(apiRef, params),
    remove_editors_did: (params: any) => (methods as any).remove_editors_did(apiRef, params),
    update_agent_did: (params: any) => (methods as any).update_agent_did(apiRef, params),
    update_document_mutable_metadata: (params: any) => (methods as any).update_document_mutable_metadata(apiRef, params),
    update_document_owner_did: (params: any) => (methods as any).update_document_owner_did(apiRef, params),
    update_document_status: (params: any) => (methods as any).update_document_status(apiRef, params),
    update_document_url: (params: any) => (methods as any).update_document_url(apiRef, params),
    update_document_url_hash: (params: any) => (methods as any).update_document_url_hash(apiRef, params),
    update_event_mutable_metadata: (params: any) => (methods as any).update_event_mutable_metadata(apiRef, params),
    update_geo_location: (params: any) => (methods as any).update_geo_location(apiRef, params),
    update_geolocation: (params: any) => (methods as any).update_geolocation(apiRef, params),
    update_object: (params: any) => (methods as any).update_object(apiRef, params),
    update_object_did: (params: any) => (methods as any).update_object_did(apiRef, params),
    update_object_mutable_metadata: (params: any) => (methods as any).update_object_mutable_metadata(apiRef, params),
    update_op_code: (params: any) => (methods as any).update_op_code(apiRef, params),
    update_owner_did: (params: any) => (methods as any).update_owner_did(apiRef, params),
    update_publisher_did: (params: any) => (methods as any).update_publisher_did(apiRef, params),
  };

  return apiRef as ObjectIdApi;
}
