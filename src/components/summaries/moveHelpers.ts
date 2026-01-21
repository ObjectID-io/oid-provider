// src/components/summaries/moveHelpers.ts
export type MoveEdge = {
  node: {
    address: string;
    asMoveObject?: {
      contents?: {
        type?: { repr?: string };
        data?: { Struct?: Array<{ name: string; value: any }> };
      };
    };
  };
  __kind?: "object" | "document";
};

export function extractMoveValue(v: any): any {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (v.String !== undefined) return v.String;
  if (v.Number !== undefined) return v.Number;
  if (v.Bool !== undefined) return v.Bool;
  if (v.Address !== undefined) return v.Address;
  if (v.Vector !== undefined) return v.Vector;
  return v;
}

export function didNorm(d: any): string {
  return String(d ?? "")
    .trim()
    .toLowerCase()
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "");
}

export function didEq(a: any, b: any): boolean {
  const A = didNorm(a);
  const B = didNorm(b);
  return !!A && A === B;
}

export function extractDidList(v: any): string[] {
  if (!v) return [];
  if (typeof v === "object" && v.String) return [String(v.String)].filter(Boolean);

  const vec = v.Vector ?? v.vector;
  if (Array.isArray(vec)) {
    return vec
      .map((it) => (typeof it === "string" ? it : it?.String ?? it?.did ?? it?.DIDurl ?? ""))
      .map(String)
      .filter((s) => s.trim().length > 0);
  }

  if (Array.isArray(v)) {
    return v
      .map((it) => (typeof it === "string" ? it : it?.did ?? it?.DIDurl ?? ""))
      .map(String)
      .filter((s) => s.trim().length > 0);
  }

  return [];
}

export function structToMaps(edge: MoveEdge): { raw: Record<string, any>; map: Record<string, any> } {
  const struct = edge.node.asMoveObject?.contents?.data?.Struct || [];
  const raw: Record<string, any> = {};
  const map: Record<string, any> = {};
  for (const f of struct) {
    raw[f.name] = f.value;
    map[f.name] = extractMoveValue(f.value);
  }
  return { raw, map };
}

export function firstNonEmpty(...vals: any[]): any {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s.length > 0) return v;
  }
  return "";
}

export function formatEpoch(v: any): string {
  if (v === undefined || v === null || v === "") return "";
  const n = typeof v === "number" ? v : Number(String(v));
  if (!Number.isFinite(n) || n <= 0) return "";

  // accetta sia ms che s
  const ms = n < 1e12 ? n * 1000 : n;

  try {
    return new Date(ms).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}
