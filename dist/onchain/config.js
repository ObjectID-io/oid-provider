import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
import { DEFAULT_SHARED_CONFIG_OBJECT_ID } from "./defaults";
function normalizeHex(s) {
    const x = String(s ?? "").trim();
    if (!x)
        return "";
    return x.startsWith("0x") ? x : `0x${x}`;
}
function decodeJsonBytes(bytes) {
    if (!Array.isArray(bytes))
        throw new Error("Expected vector<u8> (array) in fields.json");
    if (bytes.length === 0)
        return {};
    const u8 = new Uint8Array(bytes.map((n) => Number(n)));
    const text = new TextDecoder("utf-8").decode(u8).trim();
    if (!text)
        return {};
    return JSON.parse(text);
}
export async function getObjectJson(client, objectId) {
    const resp = await client.getObject({
        id: normalizeHex(objectId),
        options: { showContent: true, showType: true },
    });
    const fields = resp?.data?.content?.fields;
    if (!fields)
        throw new Error("Object has no Move fields/content");
    return decodeJsonBytes(fields.json);
}
/**
 * Loads a config JSON stored as UTF-8 bytes in `Config.json` (vector<u8>) by object id.
 * Uses JSON-RPC only (browser CORS must allow the node endpoint).
 */
export async function loadConfigJsonByObjectId(network, objectId) {
    const client = new IotaClient({ url: getFullnodeUrl(network) });
    return await getObjectJson(client, objectId);
}
export function configType(packageId) {
    // <pkg>::oid_config::Config
    return `${normalizeHex(packageId)}::oid_config::Config`;
}
/**
 * Finds the latest user-owned Config object for the given address, if any.
 * IMPORTANT: filters strictly by StructType == <cfgPkg>::oid_config::Config (no suffix matching).
 */
export async function findUserConfigObjectId(client, owner, configPkgId) {
    const type = configType(configPkgId);
    const resp = await client.getOwnedObjects({
        owner: normalizeHex(owner),
        filter: { StructType: type },
        options: { showType: true, showContent: false },
        limit: 10,
    });
    const data = resp?.data ?? [];
    if (!data.length)
        return null;
    data.sort((a, b) => Number(b?.data?.version ?? b?.version ?? 0) - Number(a?.data?.version ?? a?.version ?? 0));
    const objId = data[0]?.data?.objectId ?? data[0]?.objectId ?? null;
    return objId ? String(objId) : null;
}
/**
 * Loads the effective config:
 * 1) user-owned Config (same configPkgId) if present
 * 2) HARD default shared Config pinned in DEFAULT_SHARED_CONFIG_OBJECT_ID[network]
 *
 * No discovery via tx and no GraphQL.
 */
/**
 * Loads the public/shared default config for a given network (pinned object id).
 * This does NOT attempt to load any user-owned config.
 */
export async function loadPublicConfig(network) {
    const client = new IotaClient({ url: getFullnodeUrl(network) });
    const defaultId = DEFAULT_SHARED_CONFIG_OBJECT_ID[network];
    if (!defaultId)
        throw new Error(`Missing DEFAULT_SHARED_CONFIG_OBJECT_ID for network=${network}`);
    const json = await getObjectJson(client, defaultId);
    return { source: "default", objectId: String(defaultId), json };
}
export async function loadEffectiveConfig(network, configPkgs, ownerAddress) {
    const client = new IotaClient({ url: getFullnodeUrl(network) });
    const cfgPkg = network === "mainnet" ? configPkgs.mainnet : configPkgs.testnet;
    if (!cfgPkg)
        throw new Error(`Missing config packageId for network=${network}`);
    const userId = await findUserConfigObjectId(client, ownerAddress, cfgPkg);
    if (userId) {
        const json = await getObjectJson(client, userId);
        return { source: "user", objectId: userId, json };
    }
    const defaultId = DEFAULT_SHARED_CONFIG_OBJECT_ID[network];
    if (!defaultId) {
        throw new Error(`Missing DEFAULT_SHARED_CONFIG_OBJECT_ID for network=${network}`);
    }
    const json = await getObjectJson(client, defaultId);
    return { source: "default", objectId: defaultId, json };
}
export const dlvcProxyUrl = "https://api.objectid.io/api/dlvc-proxy";
//# sourceMappingURL=config.js.map