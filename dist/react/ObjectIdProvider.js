import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { createObjectIdApi } from "../api";
import { loadEffectiveConfig, loadConfigJsonByObjectId } from "../onchain/config";
import { DEFAULT_CONFIG_PACKAGE_IDS } from "../onchain/defaults";
const C = createContext(undefined);
function isNonEmptyString(x) {
    return typeof x === "string" && x.trim().length > 0;
}
function mapJsonToProviderConfig(base, j) {
    const objectPackages = j.objectPackages ?? j.object_packages;
    const documentPackages = j.documentPackages ?? j.document_packages;
    const objectDefaultPackageVersion = j.objectDefaultPackageVersion ?? j.objectDefaultPackageVersione ?? j.object_default_package_version ?? 0;
    const documentDefaultPackageVersion = j.documentDefaultPackageVersion ?? j.documentDefaultPackageVersione ?? j.document_default_package_version ?? 0;
    const graphqlProvider = j.graphqlProvider ?? j.graphql_provider;
    const useGasStation = !!(j.useGasStation ?? j.use_gas_station);
    const gasStation = j.gasStation ?? j.gas_station;
    return {
        network: base.network,
        seed: base.seed,
        gasBudget: base.gasBudget,
        graphqlProvider: isNonEmptyString(graphqlProvider) ? graphqlProvider : undefined,
        objectPackages: Array.isArray(objectPackages) ? objectPackages : undefined,
        documentPackages: Array.isArray(documentPackages) ? documentPackages : undefined,
        objectDefaultPackageVersion: Number(objectDefaultPackageVersion) || 0,
        documentDefaultPackageVersion: Number(documentDefaultPackageVersion) || 0,
        useGasStation,
        gasStation: gasStation && typeof gasStation === "object" ? gasStation : undefined,
    };
}
/**
 * ObjectID Provider that auto-loads configuration from the on-chain config package.
 *
 * External configuration: ONLY the config package ids (testnet/mainnet).
 *
 * Runtime flow:
 * - call `connect({ network, seed, gasBudget? })`
 * - provider derives address, loads user-owned Config if present; otherwise loads shared default Config
 * - provider initializes the ObjectID API with the loaded JSON config
 */
export function ObjectID({ configPackageIds, children }) {
    const effectiveConfigPackageIds = configPackageIds ?? DEFAULT_CONFIG_PACKAGE_IDS;
    const [session, setSession] = useState(null);
    const [loaded, setLoaded] = useState(null);
    const [api, setApi] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    const buildApi = useCallback((sess, cfgJson) => {
        const gasBudget = Number(sess.gasBudget ?? 10_000_000);
        const providerCfg = mapJsonToProviderConfig({ network: sess.network, seed: sess.seed, gasBudget }, cfgJson);
        return createObjectIdApi(providerCfg);
    }, []);
    const connect = useCallback(async (sess) => {
        setStatus("loading");
        setError(null);
        setSession(sess);
        try {
            // derive address without building full api first
            const tmpApi = createObjectIdApi({
                network: sess.network,
                seed: sess.seed,
                gasBudget: Number(sess.gasBudget ?? 10_000_000),
            });
            const env = await tmpApi.env();
            const ownerAddress = env.sender;
            const cfg = await loadEffectiveConfig(sess.network, effectiveConfigPackageIds, ownerAddress);
            const finalApi = buildApi(sess, cfg.json);
            setLoaded(cfg);
            setApi(finalApi);
            setStatus("ready");
        }
        catch (e) {
            setApi(null);
            setLoaded(null);
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [effectiveConfigPackageIds, buildApi]);
    const disconnect = useCallback(() => {
        setSession(null);
        setLoaded(null);
        setApi(null);
        setStatus("idle");
        setError(null);
    }, []);
    const applyCfg = useCallback(async (json) => {
        if (!session)
            throw new Error("Not connected");
        setStatus("loading");
        setError(null);
        try {
            const finalApi = buildApi(session, json);
            setLoaded({ source: "manual", objectId: "", json });
            setApi(finalApi);
            setStatus("ready");
        }
        catch (e) {
            setApi(null);
            setLoaded(null);
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [buildApi, session]);
    const applyCfgObject = useCallback(async (objectId) => {
        if (!session)
            throw new Error("Not connected");
        setStatus("loading");
        setError(null);
        try {
            const json = await loadConfigJsonByObjectId(session.network, objectId);
            const finalApi = buildApi(session, json);
            setLoaded({ source: "object", objectId: String(objectId), json });
            setApi(finalApi);
            setStatus("ready");
        }
        catch (e) {
            setApi(null);
            setLoaded(null);
            setStatus("error");
            setError(e?.message ?? String(e));
            throw e;
        }
    }, [buildApi, session]);
    const refreshConfig = useCallback(async () => {
        if (!session)
            throw new Error("Not connected");
        await connect(session);
    }, [connect, session]);
    const value = useMemo(() => ({
        api,
        session,
        config: loaded,
        status,
        error,
        connect,
        disconnect,
        refreshConfig,
        applyCfg,
        applyCfgObject,
    }), [api, session, loaded, status, error, connect, disconnect, refreshConfig, applyCfg, applyCfgObject]);
    return _jsx(C.Provider, { value: value, children: children });
}
export function useOptionalObjectId() {
    const ctx = useContext(C);
    if (!ctx)
        throw new Error("useOptionalObjectId must be used within ObjectID");
    return ctx.api;
}
export function useObjectId() {
    const ctx = useContext(C);
    if (!ctx)
        throw new Error("useObjectId must be used within ObjectID");
    if (!ctx.api)
        throw new Error("ObjectID API not initialized. Call connect({network, seed}) first.");
    return ctx.api;
}
export function useObjectIDSession() {
    const ctx = useContext(C);
    if (!ctx)
        throw new Error("useObjectIDSession must be used within ObjectID");
    return {
        status: ctx.status,
        error: ctx.error,
        session: ctx.session,
        config: ctx.config,
        connect: ctx.connect,
        disconnect: ctx.disconnect,
        refreshConfig: ctx.refreshConfig,
        applyCfg: ctx.applyCfg,
        applyCfgObject: ctx.applyCfgObject,
    };
}
//# sourceMappingURL=ObjectIdProvider.js.map