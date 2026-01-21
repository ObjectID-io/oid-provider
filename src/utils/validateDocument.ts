// src/utils/validateDocument.ts
import { getFullnodeUrl, IotaClient } from "@iota/iota-sdk/client";
import { validateDid } from "./validateDID";
import { resolveDID } from "./resolveDID";
import { validate_dlvc } from "./validateDLVC";

const debug = false;

export type ValidationResult = {
  check: boolean[];
  checkMsg: string[];
  checked: boolean;
  // compat con validateObject
  distance: number;
};

export const validateDocument = async (
  documentData: any, // può essere objectId (string) oppure oggetto RPC/GraphQL
  officialPackages: string[],
  network: string
): Promise<ValidationResult> => {
  const fullnodeUrl = getFullnodeUrl(network);
  const client = new IotaClient({ url: fullnodeUrl });

  // 0) Se arriva un id, carica l'oggetto dalla chain
  const docObj = await normalizeToObject(documentData, client);

  const typeRepr = getTypeRepr(docObj);
  const fields = extractMoveFields(docObj);

  const creator_did = fields.creator_did;
  const owner_did = fields.owner_did;
  const publisher_did = fields.publisher_did;
  const editors_dids = asStringArray(fields.editors_dids);
  const approvers_dids = asStringArray(fields.approvers_dids);

  const c: ValidationResult = {
    check: [],
    checkMsg: [],
    checked: false,
    distance: 9999,
  };

  // 1) SmartContract Validation
  const docPackage = String(typeRepr || "").split("::")[0];
  const isOfficial = !!docPackage && officialPackages.includes(docPackage);

  if (debug) console.log("SC validation", { typeRepr, docPackage, isOfficial });

  c.check.push(isOfficial);
  c.checkMsg.push(
    isOfficial
      ? "Document has been created by an official smart contract."
      : "Document has been created by an unofficial smart contract."
  );

  // helper: validate a DID (required)
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

  // helper: validate a DID (optional; skip if empty)
  const validateOptionalDid = async (label: string, didValue: any) => {
    if (!isNonEmptyString(didValue)) return; // skip (no check line)
    await validateRequiredDid(label, didValue);
  };

  // helper: validate a list of DIDs (one check per entry)
  const validateDidList = async (label: string, dids: string[]) => {
    if (!dids.length) return; // skip
    for (let i = 0; i < dids.length; i++) {
      await validateRequiredDid(`${label} #${i + 1}`, dids[i]);
    }
  };

  // 2) Creator DID validation (required)
  if (debug) console.log("Creator DID", creator_did);
  await validateRequiredDid("Creator", creator_did);

  // 3) Creator DLVC validation (required)
  if (debug) console.log("Creator DLVC");
  try {
    if (!isNonEmptyString(creator_did)) {
      c.check.push(false);
      c.checkMsg.push("The Internet Domain is linked with the creator DID (DLVC is invalid).");
    } else {
      const creatorFrag = didFragment(creator_did);
      const didDocument = await resolveDID(creatorFrag, client, network);
      const dlvcOk = didDocument ? await validate_dlvc(didDocument, creator_did) : false;

      c.check.push(!!dlvcOk);
      c.checkMsg.push(
        dlvcOk
          ? "The Internet Domain is linked with the creator DID (DLVC is valid)."
          : "The Internet Domain is linked with the creator DID (DLVC is invalid)."
      );
    }
  } catch {
    c.check.push(false);
    c.checkMsg.push("The Internet Domain is linked with the creator DID (DLVC is invalid).");
  }

  // 4) Owner DID validation (optional)
  if (debug) console.log("Owner DID", owner_did);
  await validateOptionalDid("Owner", owner_did);

  // 5) Publisher DID validation (optional)
  if (debug) console.log("Publisher DID", publisher_did);
  await validateOptionalDid("Publisher", publisher_did);

  // 6) Editors DIDs validation
  if (debug) console.log("Editors DIDs", editors_dids);
  await validateDidList("Editor DID", editors_dids);

  // 7) Approvers DIDs validation
  if (debug) console.log("Approvers DIDs", approvers_dids);
  await validateDidList("Approver DID", approvers_dids);

  c.checked = true;
  if (debug) console.log("Validation Result:", c);
  return c;
};

/* =========================
   Helpers locali
========================= */

async function normalizeToObject(input: any, client: IotaClient): Promise<any> {
  if (!input) throw new Error("Missing document data.");
  if (typeof input === "string") {
    const id = input.trim();
    if (!id) throw new Error("Missing document id.");

    // IOTA/Sui-style: getObject può accettare shape diverse a seconda SDK/versione
    // Provo più forme in fallback per evitare rotture.
    const opts = { showContent: true, showType: true };

    try {
      return await (client as any).getObject({ id, options: opts });
    } catch {
      try {
        return await (client as any).getObject({ objectId: id, options: opts });
      } catch {
        // ultima chance: alcuni SDK usano { objectId, options: { showContent:true, showType:true } }
        return await (client as any).getObject({ objectId: id, options: opts });
      }
    }
  }
  return input;
}

function getTypeRepr(o: any): string {
  // RPC
  const rpcType = o?.data?.content?.type ?? o?.data?.type ?? o?.type;
  // GraphQL
  const gqlType = o?.node?.asMoveObject?.contents?.type?.repr ?? o?.asMoveObject?.contents?.type?.repr;
  return String(rpcType ?? gqlType ?? "");
}

function extractMoveFields(o: any): Record<string, any> {
  // RPC MoveObject: data.content.fields
  const rpcFields = o?.data?.content?.fields ?? o?.data?.content?.data?.fields;
  if (rpcFields && typeof rpcFields === "object") return rpcFields as Record<string, any>;

  // GraphQL Struct: data.Struct => [{name,value},...]
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

function asStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v.Vector && Array.isArray(v.Vector)) return v.Vector.map((x: any) => String(x?.String ?? x));
  if (typeof v === "string") {
    if (v.includes("did:") && v.includes(",")) {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [v];
  }
  return [String(v)];
}
