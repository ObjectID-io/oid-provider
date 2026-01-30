import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

import type { ObjectIdApi } from "../api";
import { createObjectIdApi } from "../api";
import { signAndExecute } from "../utils/tx";

import type { ObjectIdProviderConfig, gasStationCfg } from "../types/types";
import type { ConfigPackageIds, LoadedConfig } from "../onchain/config";
import { loadPublicConfig, loadConfigJsonByObjectId } from "../onchain/config";
import { DEFAULT_CONFIG_PACKAGE_IDS } from "../onchain/defaults";

import { getObject } from "../onchain/getObjects";

type Session = {
  network: string;
  seed: string; // hex
  gasBudget?: number;
};

type ActiveConfig = LoadedConfig & {
  // enforce only the sources we actually use in this provider flow
  source: "default" | "object";
};

type Ctx = {
  api: ObjectIdApi | null;

  /** Session is set only after connect(). */
  session: Session | null;

  /** The public/shared config for the currently selected network. */
  publicConfig: LoadedConfig | null;

  /** The active config used by the API (public by default, or overridden by applyCfg/applyCfgObject). */
  activeConfig: ActiveConfig | null;

  status: "idle" | "loading" | "ready" | "error";
  error: string | null;

  /** Selected network even before connect(). Defaults to testnet. */
  selectedNetwork: string;

  /** Loads the public config for `network` and makes it active (drops any previous override). */
  selectNetwork: (network: string) => Promise<void>;

  /** Sets seed and network, loads the public config for that network, and initializes the API with it. */
  connect: (session: Session) => Promise<void>;

  /** Clears session, API, and overrides; reloads public config for testnet and makes it active. */
  disconnect: () => Promise<void>;

  /** Reloads public config for current selectedNetwork; if active is public, updates it too. */
  refreshPublicConfig: () => Promise<void>;

  /** Forces active config back to public config (does not delete any on-chain objects). */
  usePublicConfig: () => Promise<void>;

  /**
   * Applies a JSON config by:
   * - creating a PRIVATE (owned) oid_config::Config on-chain
   * - returning the created objectId
   * - setting it as active config (and rebuilding API)
   */
  applyCfg: (json: Record<string, any>) => Promise<string>;

  /** Loads a config objectId and sets it as active config (and rebuilds API). */
  applyCfgObject: (objectId: string) => Promise<string>;
};

const C = createContext<Ctx | undefined>(undefined);

export type ObjectIDProps = {
  /** Optional. If omitted, the SDK uses DEFAULT_CONFIG_PACKAGE_IDS. */
  configPackageIds?: ConfigPackageIds;
  children: React.ReactNode;
};

function isNonEmptyString(x: any) {
  return typeof x === "string" && x.trim().length > 0;
}

function withTimeout<T>(p: Promise<T>, ms = 15_000, label = "operation"): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timeout (${ms}ms)`)), ms)),
  ]);
}

type CachedCfg = { objectId: string; json: Record<string, any> };

function cacheKey(network: string) {
  return `objectid_public_cfg_${network}`;
}

function readCachedPublic(network: string): CachedCfg | null {
  try {
    const raw = localStorage.getItem(cacheKey(network));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.objectId !== "string" || !obj.objectId) return null;
    if (!obj.json || typeof obj.json !== "object") return null;
    return { objectId: obj.objectId, json: obj.json };
  } catch {
    return null;
  }
}

function writeCachedPublic(network: string, cfg: { objectId: string; json: Record<string, any> }) {
  try {
    localStorage.setItem(cacheKey(network), JSON.stringify({ objectId: cfg.objectId, json: cfg.json }));
  } catch {
    // ignore quota / privacy mode
  }
}

function mapJsonToProviderConfig(
  base: { network: string; seed: string; gasBudget: number },
  j: Record<string, any>,
): ObjectIdProviderConfig {
  const objectPackages = j.objectPackages ?? j.object_packages;
  const documentPackages = j.documentPackages ?? j.document_packages;

  if (!Array.isArray(objectPackages) || objectPackages.length === 0) {
    const keys = Object.keys(j ?? {}).join(", ");
    throw new Error(`Missing required field in on-chain config JSON: objectPackages (keys: ${keys})`);
  }
  if (!Array.isArray(documentPackages) || documentPackages.length === 0) {
    const keys = Object.keys(j ?? {}).join(", ");
    throw new Error(`Missing required field in on-chain config JSON: documentPackages (keys: ${keys})`);
  }

  const objectDefaultPackageVersion =
    j.objectDefaultPackageVersion ?? j.objectDefaultPackageVersione ?? j.object_default_package_version ?? 0;

  const documentDefaultPackageVersion =
    j.documentDefaultPackageVersion ?? j.documentDefaultPackageVersione ?? j.document_default_package_version ?? 0;

  const graphqlProvider = j.graphqlProvider ?? j.graphql_provider;
  if (!isNonEmptyString(graphqlProvider)) {
    const keys = Object.keys(j ?? {}).join(", ");
    throw new Error(`Missing required field in on-chain config JSON: graphqlProvider (keys: ${keys})`);
  }

  const useGasStation = !!(j.useGasStation ?? j.use_gas_station);
  const gasStation = j.gasStation ?? j.gas_station;

  return {
    network: base.network,
    seed: base.seed,
    gasBudget: base.gasBudget,

    graphqlProvider: String(graphqlProvider),

    objectPackages,
    documentPackages,

    objectDefaultPackageVersion: Number(objectDefaultPackageVersion) || 0,
    documentDefaultPackageVersion: Number(documentDefaultPackageVersion) || 0,

    useGasStation,
    gasStation: gasStation && typeof gasStation === "object" ? gasStation : undefined,
  };
}

function hexToU8a(hex: string): Uint8Array {
  const s = String(hex || "")
    .trim()
    .replace(/^0x/i, "");
  if (!s) throw new Error("Missing seed");
  if (s.length % 2 !== 0) throw new Error("Seed hex length must be even");
  const bytes = new Uint8Array(s.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = s.slice(i * 2, i * 2 + 2);
    const v = Number.parseInt(byte, 16);
    if (Number.isNaN(v)) throw new Error("Invalid seed hex");
    bytes[i] = v;
  }
  return bytes;
}

export function ObjectID({ configPackageIds, children }: ObjectIDProps) {
  const effectiveConfigPackageIds = configPackageIds ?? DEFAULT_CONFIG_PACKAGE_IDS;

  const [selectedNetwork, setSelectedNetwork] = useState<string>("testnet");

  const [session, setSession] = useState<Session | null>(null);
  const [publicConfig, setPublicConfig] = useState<LoadedConfig | null>(null);
  const [activeConfig, setActiveConfig] = useState<ActiveConfig | null>(null);

  const [api, setApi] = useState<ObjectIdApi | null>(null);
  const [status, setStatus] = useState<Ctx["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const clientsRef = useRef<Record<string, IotaClient>>({});

  const getClientForNetwork = useCallback((net: string) => {
    const key = String(net);
    if (!clientsRef.current[key]) {
      clientsRef.current[key] = new IotaClient({ url: getFullnodeUrl(net as any) });
    }
    return clientsRef.current[key];
  }, []);

  // Load public config at startup (selectedNetwork defaults to testnet).
  // Uses localStorage cache to avoid blocking reloads; refreshes in background.
  useEffect(() => {
    let cancelled = false;

    const net = selectedNetwork;

    // 1) Fast path: cached public config
    const cached = readCachedPublic(net);
    if (cached) {
      setPublicConfig({ source: "default", objectId: cached.objectId, json: cached.json } as any);
      setActiveConfig({ source: "default", objectId: cached.objectId, json: cached.json } as any);
      setStatus("ready");
      setError(null);
    } else {
      setStatus("loading");
      setError(null);
    }

    // 2) Refresh from chain (always), but never leave infinite loading
    (async () => {
      try {
        const cfg = await withTimeout(loadPublicConfig(net), 15_000, `loadPublicConfig(${net})`);
        if (cancelled) return;

        setPublicConfig(cfg);
        setActiveConfig((prev) => {
          // if active is public OR nothing yet, update active too; if active is object, keep it
          if (!prev || prev.source === "default") return { ...cfg, source: "default" } as any;
          return prev;
        });

        writeCachedPublic(net, { objectId: cfg.objectId, json: cfg.json });

        // If we were loading with no cache, mark ready now.
        setStatus("ready");
        setError(null);
      } catch (e: any) {
        if (cancelled) return;

        // If we already had cache, keep ready and show no blocking error.
        // If we had no cache and were loading, move to error (not infinite loading).
        setStatus(cached ? "ready" : "error");
        setError(e?.message ?? String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNetwork]);

  const buildApi = useCallback((sess: Session, cfgJson: Record<string, any>) => {
    const gasBudget = Number(sess.gasBudget ?? 10_000_000);
    const providerCfg = mapJsonToProviderConfig({ network: sess.network, seed: sess.seed, gasBudget }, cfgJson);
    return createObjectIdApi(providerCfg);
  }, []);

  const selectNetwork = useCallback(
    async (network: string) => {
      setStatus("loading");
      setError(null);

      try {
        const cfg = await loadPublicConfig(network);
        setSelectedNetwork(network);
        setPublicConfig(cfg);
        setActiveConfig({ ...cfg, source: "default" });

        // If already connected, rebuild API using PUBLIC config for the chosen network
        if (session) {
          const nextSession = { ...session, network };
          setSession(nextSession);
          const nextApi = buildApi(nextSession, cfg.json);
          setApi(nextApi);
        }

        setStatus("ready");
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? String(e));
        throw e;
      }
    },
    [buildApi, session],
  );

  const connect = useCallback(
    async (sess: Session) => {
      setStatus("loading");
      setError(null);

      try {
        // Always start from PUBLIC config for chosen network (no auto private cfg)
        const cfg = await loadPublicConfig(sess.network);

        setSelectedNetwork(sess.network);
        setSession(sess);
        setPublicConfig(cfg);
        setActiveConfig({ ...cfg, source: "default" });

        const finalApi = buildApi(sess, cfg.json);
        setApi(finalApi);

        setStatus("ready");
      } catch (e: any) {
        setApi(null);
        setSession(null);
        setPublicConfig(null);
        setActiveConfig(null);
        setStatus("error");
        setError(e?.message ?? String(e));
        throw e;
      }
    },
    [buildApi],
  );

  const disconnect = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      setApi(null);
      setSession(null);

      // Reset to testnet public config
      const cfg = await loadPublicConfig("testnet");
      setSelectedNetwork("testnet");
      setPublicConfig(cfg);
      setActiveConfig({ ...cfg, source: "default" });

      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? String(e));
      throw e;
    }
  }, []);

  const refreshPublicConfig = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const cfg = await loadPublicConfig(selectedNetwork);
      setPublicConfig(cfg);

      // If active is public, refresh active too.
      setActiveConfig((prev) => {
        if (!prev || prev.source === "default") return { ...cfg, source: "default" };
        return prev;
      });

      // If connected and active is public, rebuild api.
      if (session) {
        setApi((prevApi) => {
          if (!prevApi) return buildApi(session, cfg.json);
          // if active is public, we rebuild; if active is object, keep current api.
          if (!activeConfig || activeConfig.source === "default") return buildApi(session, cfg.json);
          return prevApi;
        });
      }

      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? String(e));
      throw e;
    }
  }, [activeConfig, buildApi, selectedNetwork, session]);

  const usePublicConfig = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const cfg = publicConfig ?? (await loadPublicConfig(selectedNetwork));
      setPublicConfig(cfg);
      setActiveConfig({ ...cfg, source: "default" });

      if (session) {
        const nextApi = buildApi(session, cfg.json);
        setApi(nextApi);
      } else {
        setApi(null);
      }

      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? String(e));
      throw e;
    }
  }, [buildApi, publicConfig, selectedNetwork, session]);

  const applyCfg = useCallback(
    async (json: Record<string, any>) => {
      if (!session) throw new Error("Not connected");

      const cfgPkg =
        session.network === "mainnet" ? effectiveConfigPackageIds.mainnet : effectiveConfigPackageIds.testnet;

      if (!cfgPkg) throw new Error(`Missing config packageId for network=${session.network}`);

      setStatus("loading");
      setError(null);

      try {
        const s = JSON.stringify(json);
        const bytes = Array.from(new TextEncoder().encode(s));

        const keyPair = Ed25519Keypair.deriveKeypairFromSeed(session.seed);
        const client = new IotaClient({ url: getFullnodeUrl(session.network as any) });
        const sender = keyPair.toIotaAddress();

        const tx = new Transaction();
        tx.moveCall({
          target: `${cfgPkg}::oid_config::create_user_config`,
          arguments: [tx.pure.vector("u8", bytes)],
        });

        const gasBudget = Number(session.gasBudget ?? 10_000_000);
        tx.setGasBudget(gasBudget);
        tx.setSender(sender);

        const useGasStation = !!(json.useGasStation ?? json.use_gas_station);
        const gasStation = (json.gasStation ?? json.gas_station) as gasStationCfg | undefined;

        const r = await signAndExecute(client, keyPair, tx, {
          network: String(session.network),
          gasBudget,
          useGasStation,
          gasStation,
        });

        if (!r.success) {
          throw new Error(`create_user_config failed: ${String(r.error ?? "")}`);
        }

        const createdId =
          (r.txEffect as any)?.effects?.created?.[0]?.reference?.objectId ||
          (r.txEffect as any)?.effects?.created?.[0]?.objectId ||
          (r as any)?.createdObjectId;

        if (!createdId) {
          throw new Error("create_user_config succeeded but cannot extract created objectId from tx effects");
        }

        // Activate this config and rebuild api
        setActiveConfig({ source: "object", objectId: String(createdId), json } as any);
        const nextApi = buildApi(session, json);
        setApi(nextApi);

        setStatus("ready");
        return String(createdId);
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? String(e));
        throw e;
      }
    },
    [buildApi, effectiveConfigPackageIds, session],
  );

  const applyCfgObject = useCallback(
    async (objectId: string) => {
      setStatus("loading");
      setError(null);

      try {
        const net = session?.network ?? selectedNetwork;
        const json = await loadConfigJsonByObjectId(net, objectId);

        setActiveConfig({ source: "object", objectId: String(objectId), json } as any);

        if (session) {
          const nextApi = buildApi(session, json);
          setApi(nextApi);
        }

        setStatus("ready");
        return String(objectId);
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? String(e));
        throw e;
      }
    },
    [buildApi, selectedNetwork, session],
  );

  const getCfgJsonForNet = useCallback(
    async (net: string): Promise<Record<string, any>> => {
      // Se connesso e la rete combacia, usa active/public già in memoria
      if (session?.network === net) {
        const j = (activeConfig?.json as any) ?? (publicConfig?.json as any);
        if (j) return j;
      }

      // Se non connesso (o rete diversa), usa cache localStorage per quella rete
      const cached = readCachedPublic(net);
      if (cached?.json) return cached.json;

      // Fallback: carica on-chain e aggiorna cache
      const cfg = await loadPublicConfig(net);
      writeCachedPublic(net, { objectId: cfg.objectId, json: cfg.json });
      return cfg.json as any;
    },
    [activeConfig, publicConfig, session],
  );

  const value = useMemo<Ctx>(
    () => ({
      api,
      session,
      publicConfig,
      activeConfig,
      status,
      error,
      selectedNetwork,
      selectNetwork,
      connect,
      disconnect,
      refreshPublicConfig,
      usePublicConfig,
      applyCfg,
      applyCfgObject,
    }),
    [
      api,
      session,
      publicConfig,
      activeConfig,
      status,
      error,
      selectedNetwork,
      selectNetwork,
      connect,
      disconnect,
      refreshPublicConfig,
      usePublicConfig,
      applyCfg,
      applyCfgObject,
    ],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useOptionalObjectId(): ObjectIdApi | null {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useOptionalObjectId must be used within ObjectID");
  return ctx.api;
}

export function useObjectId(): ObjectIdApi {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useObjectId must be used within ObjectID");
  if (!ctx.api) throw new Error("ObjectID API not initialized. Call connect({network, seed}) first.");
  return ctx.api;
}

export function useObjectIDSession() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useObjectIDSession must be used within ObjectID");
  return ctx;
}
