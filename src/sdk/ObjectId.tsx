import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createOid } from "@objectid/objectid-provider";
import { useAppState } from "../state/AppState";

type Network = "testnet" | "mainnet";
type OidInstance = ReturnType<typeof createOid>;

type ConnectParams = {
  network: Network;
  seed: string;
  did: string;
};

type Ctx = {
  oid: OidInstance;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;

  connect: (p: ConnectParams) => Promise<void>;
  disconnect: () => void;
};

const OidC = createContext<Ctx | undefined>(undefined);

export default function ObjectId({ children }: { children: React.ReactNode }) {
  const { isReady, config } = useAppState();

  const [oid, setOid] = useState<OidInstance>(() => createOid());
  const [status, setStatus] = useState<Ctx["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const connect = async (p: ConnectParams) => {
    setError(null);
    setStatus("loading");

    try {
      const did = typeof p.did === "string" ? p.did.trim() : "";
      const seed = typeof p.seed === "string" ? p.seed.trim() : "";
      const network = p.network;

      if (!did) throw new Error("DID is required.");
      if (!seed) throw new Error("Seed is required.");
      if (network !== "testnet" && network !== "mainnet") throw new Error("Invalid network.");

      // IMPORTANT: new provider signature is (did, seed, network)
      await (oid as any).config(did, seed, network);

      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? String(e));
      throw e;
    }
  };

  const disconnect = () => {
    setOid(createOid());
    setStatus("idle");
    setError(null);
  };

  // Auto-connect using persisted AppState config
  useEffect(() => {
    if (!isReady) return;
    if (!config) return;
    if (status === "ready" || status === "loading") return;

    const did = typeof config.did === "string" ? config.did.trim() : "";
    if (!did) return;

    connect({
      network: config.network as Network,
      seed: config.seed,
      did,
    }).catch(() => {
      // error already stored in state
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, config?.network, config?.seed, config?.did]);

  const value = useMemo<Ctx>(() => ({ oid, status, error, connect, disconnect }), [oid, status, error]);

  return (
    <OidC.Provider value={value}>
      {status === "loading" && (
        <div className="card" style={{ marginBottom: 12 }}>
          Loading on-chain configuration…
        </div>
      )}
      {status === "error" && error && (
        <div className="card" style={{ marginBottom: 12 }}>
          <span className="error">Provider error:</span> {error}
        </div>
      )}
      {children}
    </OidC.Provider>
  );
}

export function useOidCtx() {
  const ctx = useContext(OidC);
  if (!ctx) throw new Error("useOidCtx must be used within <ObjectId />");
  return ctx;
}

export function useOid() {
  return useOidCtx().oid;
}

export function useOidStatus() {
  const { status, error } = useOidCtx();
  return { status, error };
}
