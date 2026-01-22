import type { IotaObjectData } from "@iota/iota-sdk/client";

/**
 * Best-effort extraction of a token balance from a Move object.
 * Handles common shapes and falls back to a deep scan for the first numeric string.
 */
export function extractBalance(obj: IotaObjectData | null): string | null {
  if (!obj) return null;
  const fields = (obj as any)?.content?.fields;
  if (!fields) return null;

  // common shapes:
  // balance: "123"
  // balance: { fields: { value: "123" } }
  const b = (fields as any).balance;
  if (typeof b === "string") return b;
  if (typeof b === "number") return String(b);
  if (b && typeof b === "object") {
    const v = (b as any).fields?.value ?? (b as any).value;
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
  }

  // fallback: deep search for first numeric-like string
  const stack: any[] = [fields];
  const seen = new Set<any>();
  while (stack.length) {
    const v = stack.pop();
    if (v == null) continue;
    if (typeof v === "string" && /^[0-9]+$/.test(v)) return v;
    if (typeof v !== "object") continue;
    if (seen.has(v)) continue;
    seen.add(v);
    if (Array.isArray(v)) stack.push(...v);
    else for (const k of Object.keys(v)) stack.push((v as any)[k]);
  }

  return null;
}
