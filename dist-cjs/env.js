"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEnv = resolveEnv;
exports.asJsonString = asJsonString;
const client_1 = require("@iota/iota-sdk/client");
const ed25519_1 = require("@iota/iota-sdk/keypairs/ed25519");
const graphql_1 = require("./graphql");
function mustNonEmpty(name, value, ctx) {
    const s = typeof value === "string" ? value.trim() : String(value ?? "").trim();
    if (s)
        return s;
    const keys = ctx && typeof ctx === "object" ? Object.keys(ctx).join(",") : "";
    throw new Error(`Missing required config field: ${name}${keys ? ` (available keys: ${keys})` : ""}`);
}
function mustArray(name, v) {
    if (!Array.isArray(v) || v.length === 0)
        throw new Error(`Missing required config array: ${name}`);
    return v.map((x) => String(x));
}
/**
 * Resolves runtime environment using ONLY the provider configuration (loaded from on-chain oid_config).
 * No hardcoded defaults are used here.
 */
async function resolveEnv(cfg) {
    const net = mustNonEmpty("network", cfg.network, cfg);
    const seed = mustNonEmpty("seed", cfg.seed, cfg);
    const graphqlProvider = mustNonEmpty("graphqlProvider", cfg.graphqlProvider, cfg);
    const objectPackages = mustArray("objectPackages", cfg.objectPackages);
    const documentPackages = mustArray("documentPackages", cfg.documentPackages);
    const objVer = Number(cfg.objectDefaultPackageVersion ?? 0);
    const docVer = Number(cfg.documentDefaultPackageVersion ?? 0);
    if (objVer < 0 || objVer >= objectPackages.length) {
        throw new Error(`Invalid objectDefaultPackageVersion=${objVer} (len=${objectPackages.length})`);
    }
    if (docVer < 0 || docVer >= documentPackages.length) {
        throw new Error(`Invalid documentDefaultPackageVersion=${docVer} (len=${documentPackages.length})`);
    }
    const packageID = objectPackages[objVer];
    const documentPackageID = documentPackages[docVer];
    const client = new client_1.IotaClient({ url: (0, client_1.getFullnodeUrl)(net) });
    const keyPair = ed25519_1.Ed25519Keypair.deriveKeypairFromSeed(seed);
    const sender = keyPair.toIotaAddress();
    const tokenCreditType = `0x2::token::Token<${packageID}::oid_credit::OID_CREDIT>`;
    const policyTokenType = `0x2::token::TokenPolicy<${packageID}::oid_credit::OID_CREDIT>`;
    const OIDobjectType = `${packageID}::oid_object::OIDObject`;
    // Discover the policy object id via GraphQL (required for Move calls)
    const edges = await (0, graphql_1.searchObjectsByType)(policyTokenType, null, graphqlProvider);
    if (!edges?.length)
        throw new Error("Cannot resolve policy object (no TokenPolicy found)");
    const policy = edges[0].node.address;
    return {
        client,
        keyPair,
        sender,
        network: net,
        graphqlProvider,
        packageID,
        documentPackageID,
        policy,
        tokenCreditType,
        policyTokenType,
        OIDobjectType,
    };
}
/**
 * Converts an input value to a JSON string.
 * - If value is already a string, returns it as-is.
 * - Otherwise JSON.stringify(value). Undefined/null becomes "{}".
 */
function asJsonString(value) {
    if (typeof value === "string")
        return value;
    if (value === null || value === undefined)
        return "{}";
    return JSON.stringify(value);
}
//# sourceMappingURL=env.js.map