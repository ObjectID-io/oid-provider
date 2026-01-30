import type { ObjectEdge, ObjectIdProviderConfig } from "./types/types";
import { resolveEnv, type ResolvedEnv } from "./env";
import { searchObjectsByType } from "./utils/graphql";
import { getObject } from "./utils/getObject";
import * as methods from "./methods";

export type TxMethodName = keyof typeof methods;

export type MethodParams<K extends TxMethodName> = Parameters<(typeof methods)[K]>[1];
export type MethodReturn<K extends TxMethodName> = ReturnType<(typeof methods)[K]>;

/**
 * All tx methods are defined in ./methods/* as (api, params) => ...
 * We expose them here as (params) => ... to keep IntelliSense param hints.
 */
export type TxMethods = {
  [K in TxMethodName]: (params: MethodParams<K>) => MethodReturn<K>;
};

export type ObjectIdApi = {
  env: () => Promise<ResolvedEnv>;
  gasBudget: number;
  useGasStation: boolean;
  gasStation?: import("./types/types").gasStationCfg;

  // Non-tx helpers:
  get_object: (params: { objectId: string }) => Promise<any>;
  get_objects: (params: { after?: string | null }) => Promise<ObjectEdge[]>;
  document_did_string: (params: { id: string }) => string;
} & TxMethods;

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
  };

  // Bind ALL tx methods from ./methods/* so they keep their (typed) params in IntelliSense.
  for (const k of Object.keys(methods) as Array<keyof typeof methods>) {
    // Runtime binding only; typing is provided by the ObjectIdApi & TxMethods types above.
    apiRef[k] = (params: any) => (methods as any)[k](apiRef, params);
  }

  return apiRef as ObjectIdApi;
}
