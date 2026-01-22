import type { IotaClient } from "@iota/iota-sdk/client";

import { getObject as getObjectRpc } from "../utils/getObject";

export function normalizeHex(s: string): string {
  const t = (s ?? "").trim();
  if (!t) return t;
  return t.startsWith("0x") ? t.toLowerCase() : ("0x" + t).toLowerCase();
}

function parseDidAliasId(did: string): string | null {
  const s = (did ?? "").trim();
  if (!s) return null;
  // did:iota:testnet:0xabc...  OR did:iota:0xabc...
  const parts = s.split(":");
  const last = parts[parts.length - 1];
  if (!last) return null;
  if (last.startsWith("0x") || /^[0-9a-fA-F]+$/.test(last)) return normalizeHex(last);
  return null;
}

/**
 * Deterministically pick the ControllerCap owned by `address` that matches the provided DID.
 * If multiple caps match, chooses the highest on-chain version (tie-break by objectId).
 */
export async function pickCapMatchingDid(client: IotaClient, capIds: string[], did: string): Promise<string | undefined> {
  if (!capIds.length) return undefined;

  const identityId = parseDidAliasId(did);
  if (!identityId) throw new Error("Invalid DID: missing identity id");

  const matches: Array<{ id: string; version: bigint }> = [];

  for (const id of capIds) {
    const obj: any = await getObjectRpc(client, id);

    // Deterministic link: ControllerCap.fields.controller_of == DID identity id (aliasId)
    const direct = obj?.content?.fields?.controller_of;
    const nested = obj?.content?.fields?.access_token?.fields?.value?.fields?.controller_of; // IOTA Identity (optional path)
    const controllerOf = normalizeHex(String(direct ?? nested ?? ""));

    if (controllerOf && controllerOf === identityId) {
      const vRaw = obj?.version;
      let v = 0n;
      try {
        if (typeof vRaw === "string" && vRaw) v = BigInt(vRaw);
        else if (typeof vRaw === "number") v = BigInt(vRaw);
      } catch {
        v = 0n;
      }
      matches.push({ id, version: v });
    }
  }

  if (matches.length === 0) {
    // If user owns caps but none match the provided DID, do not guess.
    throw new Error(`ControllerCap for DID not found in owned objects (did=${did})`);
  }

  // If multiple caps match, choose deterministically (highest on-chain version, tie-break by objectId).
  matches.sort((a, b) => (a.version === b.version ? a.id.localeCompare(b.id) : a.version > b.version ? -1 : 1));
  return matches[0].id;
}
