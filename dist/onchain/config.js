import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
function normalizeHex(s) {
    const x = String(s || "").trim();
    if (!x)
        return x;
    return x.startsWith("0x") ? x : ("0x" + x);
}
function decodeJsonBytes(bytes) {
    if (!Array.isArray(bytes))
        throw new Error("Expected vector<u8> (array) in fields.json");
    const u8 = new Uint8Array(bytes.map((n) => Number(n)));
    const text = new TextDecoder("utf-8").decode(u8);
    if (!text)
        throw new Error("Empty JSON bytes");
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
    // Based on your published type: <pkg>::oid_config::Config
    return `${normalizeHex(packageId)}::oid_config::Config`;
}
/**
 * Finds the shared default Config object id by looking for the most recent tx calling:
 *   <pkg>::oid_config::set_default_json
 * and extracting the mutated/created Config object id from objectChanges.
 *
 * This avoids GraphQL and does not require you to hardcode the shared object id.
 */
export async function findDefaultConfigObjectId(client, configPkgId) {
    const pkg = normalizeHex(configPkgId);
    // queryTransactionBlocks API is Sui-like; keep typing loose
    const q = await client.queryTransactionBlocks({
        filter: { MoveFunction: { package: pkg, module: "oid_config", function: "set_default_json" } },
        options: { showObjectChanges: true, showEffects: true },
        limit: 1,
        descendingOrder: true,
    });
    const tx = q?.data?.[0];
    if (!tx)
        throw new Error("Cannot find any set_default_json tx for config package (default config not initialized?)");
    const changes = tx.objectChanges ?? [];
    const wantedType = configType(pkg);
    // Prefer shared object changes
    for (const ch of changes) {
        const t = ch?.objectType || ch?.type || "";
        const oid = ch?.objectId;
        const owner = ch?.owner;
        if (!oid)
            continue;
        // In many SDKs, objectChanges entries have objectType exactly; in others, "objectType" might be in `objectType`.
        if (t === wantedType || String(t).endsWith("::oid_config::Config")) {
            // shared owner shape: { Shared: { initial_shared_version: ... } } or { Shared: number }
            if (owner?.Shared)
                return oid;
        }
    }
    // Fallback: parse effects mutated list if present
    const mutated = tx.effects?.mutated ?? tx.effects?.mutatedObjects ?? [];
    for (const m of mutated) {
        const oid = m?.reference?.objectId ?? m?.objectId;
        const ot = m?.objectType ?? "";
        const owner = m?.owner;
        if (oid && (ot === wantedType || String(ot).endsWith("::oid_config::Config")) && owner?.Shared)
            return oid;
    }
    throw new Error("Could not extract shared default Config objectId from tx changes.");
}
/**
 * Finds the latest user-owned Config object for the given address, if any.
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
    // Choose the newest by version if available, else first
    data.sort((a, b) => Number(b?.data?.version ?? b?.version ?? 0) - Number(a?.data?.version ?? a?.version ?? 0));
    const objId = data[0]?.data?.objectId ?? data[0]?.objectId ?? null;
    return objId ? String(objId) : null;
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
    const defaultId = await findDefaultConfigObjectId(client, cfgPkg);
    const json = await getObjectJson(client, defaultId);
    return { source: "default", objectId: defaultId, json };
}
//# sourceMappingURL=config.js.map