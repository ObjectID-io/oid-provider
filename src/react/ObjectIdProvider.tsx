import React, { createContext, useContext, useMemo } from "react";
import type { ObjectIdProviderConfig } from "../types";
import { createObjectIdApi, type ObjectIdApi } from "../api";

type Ctx = { api: ObjectIdApi | null };
const C = createContext<Ctx | undefined>(undefined);

export type ObjectIdProviderProps = {
  config: ObjectIdProviderConfig | null;
  children: React.ReactNode;
};

export function ObjectIdProvider({ config, children }: ObjectIdProviderProps) {
  const api = useMemo(() => {
    if (!config) return null;
    return createObjectIdApi(config);
  }, [config]);

  return <C.Provider value={{ api }}>{children}</C.Provider>;
}

export function useOptionalObjectId(): ObjectIdApi | null {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useOptionalObjectId must be used within ObjectIdProvider");
  return ctx.api;
}

export function useObjectId(): ObjectIdApi {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useObjectId must be used within ObjectIdProvider");
  if (!ctx.api) throw new Error("ObjectId API not initialized (missing config).");
  return ctx.api;
}
