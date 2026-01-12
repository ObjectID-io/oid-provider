"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectID = ObjectID;
exports.useOptionalObjectId = useOptionalObjectId;
exports.useObjectId = useObjectId;
exports.useObjectIDSession = useObjectIDSession;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_1 = require("@iota/iota-sdk/client");
const ed25519_1 = require("@iota/iota-sdk/keypairs/ed25519");
const transactions_1 = require("@iota/iota-sdk/transactions");
const api_1 = require("../api");
const tx_1 = require("../tx");
const config_1 = require("../onchain/config");
const defaults_1 = require("../onchain/defaults");
const C = (0, react_1.createContext)(undefined);
function isNonEmptyString(x) {
    return typeof x === "string" && x.trim().length > 0;
}
function withTimeout(p, ms = 15_000, label = "operation") {
    return Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timeout (${ms}ms)`)), ms)),
    ]);
}
function cacheKey(network) {
    return `objectid_public_cfg_${network}`;
}
function readCachedPublic(network) {
    try {
        const raw = localStorage.getItem(cacheKey(network));
        if (!raw)
            return null;
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== "object")
            return null;
        if (typeof obj.objectId !== "string" || !obj.objectId)
            return null;
        if (!obj.json || typeof obj.json !== "object")
            return null;
        return { objectId: obj.objectId, json: obj.json };
    }
    catch {
        return null;
    }
}
function writeCachedPublic(network, cfg) {
    try {
        localStorage.setItem(cacheKey(network), JSON.stringify({ objectId: cfg.objectId, json: cfg.json }));
    }
    catch {
        // ignore quota / privacy mode
    }
}
function mapJsonToProviderConfig(base, j) {
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
    const objectDefaultPackageVersion = j.objectDefaultPackageVersion ?? j.objectDefaultPackageVersione ?? j.object_default_package_version ?? 0;
    const documentDefaultPackageVersion = j.documentDefaultPackageVersion ?? j.documentDefaultPackageVersione ?? j.document_default_package_version ?? 0;
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
function hexToU8a(hex) {
    const s = String(hex || "")
        .trim()
        .replace(/^0x/i, "");
    if (!s)
        throw new Error("Missing seed");
    if (s.length % 2 !== 0)
        throw new Error("Seed hex length must be even");
    const bytes = new Uint8Array(s.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        const byte = s.slice(i * 2, i * 2 + 2);
        const v = Number.parseInt(byte, 16);
        if (Number.isNaN(v))
            throw new Error("Invalid seed hex");
        bytes[i] = v;
    }
    return bytes;
}
function ObjectID({ configPackageIds, children }) {
    const effectiveConfigPackageIds = configPackageIds ?? defaults_1.DEFAULT_CONFIG_PACKAGE_IDS;
    const [selectedNetwork, setSelectedNetwork] = (0, react_1.useState)("testnet");
    const [session, setSession] = (0, react_1.useState)(null);
    const [publicConfig, setPublicConfig] = (0, react_1.useState)(null);
    const [activeConfig, setActiveConfig] = (0, react_1.useState)(null);
    const [api, setApi] = (0, react_1.useState)(null);
    const [status, setStatus] = (0, react_1.useState)("idle");
    const [error, setError] = (0, react_1.useState)(null);
    // Load public config at startup (selectedNetwork defaults to testnet).
    // Uses localStorage cache to avoid blocking reloads; refreshes in background.
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        const net = selectedNetwork;
        // 1) Fast path: cached public config
        const cached = readCachedPublic(net);
        if (cached) {
            setPublicConfig({ source: "default", objectId: cached.objectId, json: cached.json });
            setActiveConfig({ source: "default", objectId: cached.objectId, json: cached.json });
            setStatus("ready");
            setError(null);
        }
        else {
            setStatus("loading");
            setError(null);
        }
        // 2) Refresh from chain (always), but never leave infinite loading
        (async () => {
            try {
                const cfg = await withTimeout((0, config_1.loadPublicConfig)(net), 15_000, `loadPublicConfig(${net})`);
                if (cancelled)
                    return;
                setPublicConfig(cfg);
                setActiveConfig((prev) => {
                    // if active is public OR nothing yet, update active too; if active is object, keep it
                    if (!prev || prev.source === "default")
                        return { ...cfg, source: "default" };
                    return prev;
                });
                writeCachedPublic(net, { objectId: cfg.objectId, json: cfg.json });
                // If we were loading with no cache, mark ready now.
                setStatus("ready");
                setError(null);
            }
            catch (e) {
                if (cancelled)
                    return;
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
    const buildApi = (0, react_1.useCallback)((sess, cfgJson) => {
        const gasBudget = Number(sess.gasBudget ?? 10_000_000);
        const providerCfg = mapJsonToProviderConfig({ network: sess.network, seed: sess.seed, gasBudget }, cfgJson);
        return (0, api_1.createObjectIdApi)(providerCfg);
    }, []);
    const selectNetwork = (0, react_1.useCallback)(async (network) => {
        setStatus("loading");
        setError(null);
        try {
            const cfg = await (0, config_1.loadPublicConfig)(network);
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
        }
        catch (e) {
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [buildApi, session]);
    const connect = (0, react_1.useCallback)(async (sess) => {
        setStatus("loading");
        setError(null);
        try {
            // Always start from PUBLIC config for chosen network (no auto private cfg)
            const cfg = await (0, config_1.loadPublicConfig)(sess.network);
            setSelectedNetwork(sess.network);
            setSession(sess);
            setPublicConfig(cfg);
            setActiveConfig({ ...cfg, source: "default" });
            const finalApi = buildApi(sess, cfg.json);
            setApi(finalApi);
            setStatus("ready");
        }
        catch (e) {
            setApi(null);
            setSession(null);
            setPublicConfig(null);
            setActiveConfig(null);
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [buildApi]);
    const disconnect = (0, react_1.useCallback)(async () => {
        setStatus("loading");
        setError(null);
        try {
            setApi(null);
            setSession(null);
            // Reset to testnet public config
            const cfg = await (0, config_1.loadPublicConfig)("testnet");
            setSelectedNetwork("testnet");
            setPublicConfig(cfg);
            setActiveConfig({ ...cfg, source: "default" });
            setStatus("ready");
        }
        catch (e) {
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, []);
    const refreshPublicConfig = (0, react_1.useCallback)(async () => {
        setStatus("loading");
        setError(null);
        try {
            const cfg = await (0, config_1.loadPublicConfig)(selectedNetwork);
            setPublicConfig(cfg);
            // If active is public, refresh active too.
            setActiveConfig((prev) => {
                if (!prev || prev.source === "default")
                    return { ...cfg, source: "default" };
                return prev;
            });
            // If connected and active is public, rebuild api.
            if (session) {
                setApi((prevApi) => {
                    if (!prevApi)
                        return buildApi(session, cfg.json);
                    // if active is public, we rebuild; if active is object, keep current api.
                    if (!activeConfig || activeConfig.source === "default")
                        return buildApi(session, cfg.json);
                    return prevApi;
                });
            }
            setStatus("ready");
        }
        catch (e) {
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [activeConfig, buildApi, selectedNetwork, session]);
    const usePublicConfig = (0, react_1.useCallback)(async () => {
        setStatus("loading");
        setError(null);
        try {
            const cfg = publicConfig ?? (await (0, config_1.loadPublicConfig)(selectedNetwork));
            setPublicConfig(cfg);
            setActiveConfig({ ...cfg, source: "default" });
            if (session) {
                const nextApi = buildApi(session, cfg.json);
                setApi(nextApi);
            }
            else {
                setApi(null);
            }
            setStatus("ready");
        }
        catch (e) {
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [buildApi, publicConfig, selectedNetwork, session]);
    const applyCfg = (0, react_1.useCallback)(async (json) => {
        if (!session)
            throw new Error("Not connected");
        const cfgPkg = session.network === "mainnet" ? effectiveConfigPackageIds.mainnet : effectiveConfigPackageIds.testnet;
        if (!cfgPkg)
            throw new Error(`Missing config packageId for network=${session.network}`);
        setStatus("loading");
        setError(null);
        try {
            const s = JSON.stringify(json);
            const bytes = Array.from(new TextEncoder().encode(s));
            const keyPair = ed25519_1.Ed25519Keypair.deriveKeypairFromSeed(session.seed);
            const client = new client_1.IotaClient({ url: (0, client_1.getFullnodeUrl)(session.network) });
            const sender = keyPair.toIotaAddress();
            const tx = new transactions_1.Transaction();
            tx.moveCall({
                target: `${cfgPkg}::oid_config::create_user_config`,
                arguments: [tx.pure.vector("u8", bytes)],
            });
            const gasBudget = Number(session.gasBudget ?? 10_000_000);
            tx.setGasBudget(gasBudget);
            tx.setSender(sender);
            const useGasStation = !!(json.useGasStation ?? json.use_gas_station);
            const gasStation = (json.gasStation ?? json.gas_station);
            const r = await (0, tx_1.signAndExecute)(client, keyPair, tx, {
                network: String(session.network),
                gasBudget,
                useGasStation,
                gasStation,
            });
            if (!r.success) {
                throw new Error(`create_user_config failed: ${String(r.error ?? "")}`);
            }
            const createdId = r.txEffect?.effects?.created?.[0]?.reference?.objectId ||
                r.txEffect?.effects?.created?.[0]?.objectId ||
                r?.createdObjectId;
            if (!createdId) {
                throw new Error("create_user_config succeeded but cannot extract created objectId from tx effects");
            }
            // Activate this config and rebuild api
            setActiveConfig({ source: "object", objectId: String(createdId), json });
            const nextApi = buildApi(session, json);
            setApi(nextApi);
            setStatus("ready");
            return String(createdId);
        }
        catch (e) {
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [buildApi, effectiveConfigPackageIds, session]);
    const applyCfgObject = (0, react_1.useCallback)(async (objectId) => {
        setStatus("loading");
        setError(null);
        try {
            const net = session?.network ?? selectedNetwork;
            const json = await (0, config_1.loadConfigJsonByObjectId)(net, objectId);
            setActiveConfig({ source: "object", objectId: String(objectId), json });
            if (session) {
                const nextApi = buildApi(session, json);
                setApi(nextApi);
            }
            setStatus("ready");
            return String(objectId);
        }
        catch (e) {
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [buildApi, selectedNetwork, session]);
    const value = (0, react_1.useMemo)(() => ({
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
    }), [
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
    ]);
    return (0, jsx_runtime_1.jsx)(C.Provider, { value: value, children: children });
}
function useOptionalObjectId() {
    const ctx = (0, react_1.useContext)(C);
    if (!ctx)
        throw new Error("useOptionalObjectId must be used within ObjectID");
    return ctx.api;
}
function useObjectId() {
    const ctx = (0, react_1.useContext)(C);
    if (!ctx)
        throw new Error("useObjectId must be used within ObjectID");
    if (!ctx.api)
        throw new Error("ObjectID API not initialized. Call connect({network, seed}) first.");
    return ctx.api;
}
function useObjectIDSession() {
    const ctx = (0, react_1.useContext)(C);
    if (!ctx)
        throw new Error("useObjectIDSession must be used within ObjectID");
    return ctx;
}
//# sourceMappingURL=ObjectIdProvider.js.map