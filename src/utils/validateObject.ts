import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
import { resolveDID } from "./resolveDID";
import { validate_dlvc } from "./validateDLVC";
import { validateDid } from "./validateDID";
import { validateGeolocation } from "./ValidateGeolocation";

export type ValidationResult = {
  check: boolean[];
  checkMsg: string[];
  checked: boolean;
  distance: number;
};

const debug = false;

/**
 * validateObject
 * - accetta sia objectId (string) sia un oggetto RPC/GraphQL
 * - estrae sempre typeRepr + fields in modo compatibile
 */
export const validateObject = async (
  objectData: any,
  officialPackages: string[],
  network: string
): Promise<ValidationResult> => {
  const fullnodeUrl = getFullnodeUrl(network);
  const client = new IotaClient({ url: fullnodeUrl });

  // 0) Se arriva un id, carica l'oggetto dalla chain
  const obj = await normalizeToObject(objectData, client);

  const typeRepr = getTypeRepr(obj);
  const fields = extractMoveFields(obj);

  const creator_did = fields.creator_did;
  const owner_did = fields.owner_did;
  const agent_did = fields.agent_did;

  const c: ValidationResult = {
    check: [],
    checkMsg: [],
    checked: false,
    distance: 9999,
  };

  // 1) SmartContract Validation
  const objectPackage = String(typeRepr || "").split("::")[0];
  const isOfficial = !!objectPackage && officialPackages.includes(objectPackage);

  if (debug) console.log("SC validation", { typeRepr, objectPackage, isOfficial });

  c.check.push(isOfficial);
  c.checkMsg.push(
    isOfficial
      ? "ObjectID has been created by an official smart contract."
      : "ObjectID has been created by an unofficial smart contract."
  );

  // helper: validate required DID
  const validateRequiredDid = async (label: string, didValue: any) => {
    try {
      if (!isNonEmptyString(didValue) || !didValue.includes(":")) {
        c.check.push(false);
        c.checkMsg.push(`${label} DID is invalid.`);
        return false;
      }
      const frag = didFragment(didValue);
      const response = await validateDid(client, network, frag);
      const ok = !!response?.success;
      c.check.push(ok);
      c.checkMsg.push(ok ? `${label} DID is valid.` : `${label} DID is invalid.`);
      return ok;
    } catch {
      c.check.push(false);
      c.checkMsg.push(`${label} DID is invalid.`);
      return false;
    }
  };

  // helper: validate optional DID (skip if empty)
  const validateOptionalDid = async (label: string, didValue: any) => {
    if (!isNonEmptyString(didValue)) return;
    await validateRequiredDid(label, didValue);
  };

  // 2) Producer/Creator DID validation (required)
  if (debug) console.log("Producer DID", creator_did);
  await validateRequiredDid("Producer", creator_did);

  // 3) Producer DLVC validation (required)
  if (debug) console.log("Producer DLVC");
  try {
    if (!isNonEmptyString(creator_did)) {
      c.check.push(false);
      c.checkMsg.push("The product Internet Domain is linked with the producer DID (DLVC is invalid).");
    } else {
      const creatorFrag = didFragment(creator_did);
      const didDocument = await resolveDID(creatorFrag, client, network);
      const dlvcOk = didDocument ? await validate_dlvc(didDocument, creator_did) : false;

      c.check.push(!!dlvcOk);
      c.checkMsg.push(
        dlvcOk
          ? "The product Internet Domain is linked with the producer DID (DLVC is valid)."
          : "The product Internet Domain is linked with the producer DID (DLVC is invalid)."
      );
    }
  } catch (error) {
    c.check.push(false);
    c.checkMsg.push("The product Internet Domain is linked with the producer DID (DLVC is invalid).");
    if (debug) console.log("DLVC NOK", error);
  }

  // 4) Owner DID validation (optional)
  if (debug) console.log("Owner DID", owner_did);
  await validateOptionalDid("Owner", owner_did);

  // 5) Agent DID validation (optional)
  if (debug) console.log("Agent DID", agent_did);
  await validateOptionalDid("Agent", agent_did);

  // 6) Geolocation validation (optional)
  if (debug) console.log("Geolocation");
  try {
    const geolocation = fields.geolocation;

    if (geolocation) {
      const geoValidation = await validateGeolocation(geolocation);
      const ok = geoValidation.check[0] === true;
      c.check.push(ok);
      c.checkMsg.push(geoValidation.checkMsg[0]);
      c.distance = geoValidation.distance;
    } else {
      c.check.push(false);
      c.checkMsg.push("No geolocation data available.");
    }
  } catch (error) {
    c.check.push(false);
    c.checkMsg.push("Geolocation validation failed.");
    if (debug) console.log("Geo NOK", error);
  }

  c.checked = true;
  if (debug) console.log("Validation Result:", c);
  return c;
};

/* =========================
   Helpers locali
========================= */

async function normalizeToObject(input: any, client: IotaClient): Promise<any> {
  if (!input) throw new Error("Missing object data.");
  if (typeof input === "string") {
    const id = input.trim();
    if (!id) throw new Error("Missing object id.");

    const opts = { showContent: true, showType: true };

    try {
      return await (client as any).getObject({ id, options: opts });
    } catch {
      try {
        return await (client as any).getObject({ objectId: id, options: opts });
      } catch {
        return await (client as any).getObject({ objectId: id, options: opts });
      }
    }
  }
  return input;
}

function getTypeRepr(o: any): string {
  const rpcType = o?.data?.content?.type ?? o?.data?.type ?? o?.type;
  const gqlType = o?.node?.asMoveObject?.contents?.type?.repr ?? o?.asMoveObject?.contents?.type?.repr;
  return String(rpcType ?? gqlType ?? "");
}

function extractMoveFields(o: any): Record<string, any> {
  const rpcFields = o?.data?.content?.fields ?? o?.data?.content?.data?.fields;
  if (rpcFields && typeof rpcFields === "object") return rpcFields as Record<string, any>;

  const struct = o?.node?.asMoveObject?.contents?.data?.Struct ?? o?.asMoveObject?.contents?.data?.Struct;
  if (Array.isArray(struct)) {
    const out: Record<string, any> = {};
    for (const f of struct) out[f.name] = extractMoveValue(f.value);
    return out;
  }
  return {};
}

function extractMoveValue(v: any): any {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (v.String !== undefined) return v.String;
  if (v.Number !== undefined) return v.Number;
  if (v.Bool !== undefined) return v.Bool;
  if (v.Address !== undefined) return v.Address;
  if (v.Vector !== undefined) return v.Vector;
  return v;
}

function didFragment(did: string): string {
  return did.split(":").pop() || "";
}

function isNonEmptyString(x: any): x is string {
  return typeof x === "string" && x.trim().length > 0;
}
