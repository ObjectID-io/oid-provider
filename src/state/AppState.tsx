import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ObjectIdProviderConfig } from "@objectid/objectid-provider";

const STORAGE_KEY = "objectid.direct.config.v2";

export type AppConfig = Pick<ObjectIdProviderConfig, "network" | "seed"> & {
  did?: string;

  // derived / cached values (resolved after connect)
  address?: string;
  creditTokenId?: string;
  oidControllerCapId?: string;
  iotaIdentityControllerCapId?: string;
};

type Ctx = {
  config: AppConfig | null;
  setConfig: (cfg: AppConfig | null) => void;
  isReady: boolean;
};

const C = createContext<Ctx | undefined>(undefined);

function sanitizeOptString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function sanitizeConfig(raw: any): AppConfig | null {
  if (!raw || typeof raw !== "object") return null;

  const network = raw.network;
  const seed = raw.seed;

  if (network !== "testnet" && network !== "mainnet") return null;
  if (typeof seed !== "string" || !seed.trim()) return null;

  return {
    network,
    seed: seed.trim(),

    did: sanitizeOptString(raw.did),

    address: sanitizeOptString(raw.address),
    creditTokenId: sanitizeOptString(raw.creditTokenId),
    oidControllerCapId: sanitizeOptString(raw.oidControllerCapId),
    iotaIdentityControllerCapId: sanitizeOptString(raw.iotaIdentityControllerCapId),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AppConfig | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const sanitized = sanitizeConfig(parsed);
        setConfigState(sanitized);

        // optional: rewrite storage to the sanitized shape
        if (sanitized) localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      }
    } catch {
      // ignore
    } finally {
      setIsReady(true);
    }
  }, []);

  const setConfig = (cfg: AppConfig | null) => {
    const sanitized = cfg ? sanitizeConfig(cfg) : null;
    setConfigState(sanitized);

    try {
      if (!sanitized) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore
    }
  };

  const value = useMemo(() => ({ config, setConfig, isReady }), [config, isReady]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useAppState() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
