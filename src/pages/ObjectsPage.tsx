// src/pages/ObjectsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOid } from "../sdk/ObjectId";

import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";

import ObjSummary from "../components/summaries/ObjSummary";
import DocSummary from "../components/summaries/DocSummary";
import { MoveEdge, didEq, extractDidList, structToMaps } from "../components/summaries/moveHelpers";

function pickPkg(pkgs: unknown, idx: unknown): string | null {
  const arr = Array.isArray(pkgs) ? pkgs : [];
  const i = typeof idx === "number" ? idx : Number(idx ?? 0);
  const v = arr[i] ?? arr[0];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function objectMatchesDid(edge: MoveEdge, myDid: string): boolean {
  const { map } = structToMaps(edge);
  const creator = map.creator_did ?? map.creator ?? "";
  const owner = map.owner_did ?? map.owner ?? "";
  const agent = map.agent_did ?? map.agent ?? "";
  return didEq(myDid, creator) || didEq(myDid, owner) || didEq(myDid, agent);
}

function documentMatchesDid(edge: MoveEdge, myDid: string): boolean {
  const { raw, map } = structToMaps(edge);

  const owner = map.owner_did ?? map.owner ?? "";
  const creator = map.creator_did ?? map.creator ?? "";
  const publisher = map.publisher_did ?? map.publisher ?? "";

  const editors = extractDidList(raw.editors_dids ?? raw.editors);
  const approvers = extractDidList(raw.approvers_dids ?? raw.approvers);

  return (
    didEq(myDid, owner) ||
    didEq(myDid, creator) ||
    didEq(myDid, publisher) ||
    editors.some((d) => didEq(d, myDid)) ||
    approvers.some((d) => didEq(d, myDid))
  );
}

export default function ObjectsPage() {
  const oid = useOid();

  const [objectsEdges, setObjectsEdges] = useState<MoveEdge[]>([]);
  const [documentsEdges, setDocumentsEdges] = useState<MoveEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const session = useMemo(() => oid.session.raw(), [oid]);
  const network = session.network;
  const ownerAddress = session.address;
  const myDid = session.did;

  const cfg = session.configJson ?? {};
  const objectPkg = pickPkg(cfg.objectPackages, cfg.objectDefaultPackageVersion);
  const documentPkg = pickPkg(cfg.documentPackages, cfg.documentDefaultPackageVersion);

  const OIDObjectType = objectPkg ? `${objectPkg}::oid_object::OIDObject` : "";
  const OIDDocumentType = documentPkg ? `${documentPkg}::oid_document::OIDDocument` : "";

  const fetchAll = useCallback(async () => {
    if (!network) return;
    if (!myDid) return;

    setLoading(true);
    setErr(null);

    try {
      if (!OIDObjectType) throw new Error("Missing objectPackages/objectDefaultPackageVersion in config.");
      if (!OIDDocumentType) throw new Error("Missing documentPackages/documentDefaultPackageVersion in config.");

      // OBJECTS: type+owner -> fallback type-only
      let objEdges: MoveEdge[] = [];
      if (ownerAddress) {
        objEdges = (await oid.getObjectsByTypeAndOwner(OIDObjectType, ownerAddress, network)) as MoveEdge[];
      }
      if (!objEdges.length) {
        objEdges = (await oid.getObjectsByType(OIDObjectType, network)) as MoveEdge[];
      }
      const filteredObjects = objEdges
        .map((e) => ({ ...e, __kind: "object" as const }))
        .filter((o) => objectMatchesDid(o, String(myDid)));

      // DOCUMENTS: type-only + DID filter (Shared)
      const docEdges = (await oid.getObjectsByType(OIDDocumentType, network)) as MoveEdge[];
      const filteredDocs = docEdges
        .map((e) => ({ ...e, __kind: "document" as const }))
        .filter((d) => documentMatchesDid(d, String(myDid)));

      setObjectsEdges(filteredObjects);
      setDocumentsEdges(filteredDocs);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setObjectsEdges([]);
      setDocumentsEdges([]);
    } finally {
      setLoading(false);
    }
  }, [oid, network, myDid, ownerAddress, OIDObjectType, OIDDocumentType]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const objects = useMemo(() => {
    const list = [...objectsEdges];
    list.sort((a, b) => {
      const am = structToMaps(a).map;
      const bm = structToMaps(b).map;
      const at = Number(am.last_update || am.updated_at || am.creation_date || am.created_at || 0);
      const bt = Number(bm.last_update || bm.updated_at || bm.creation_date || bm.created_at || 0);
      return bt - at;
    });
    return list;
  }, [objectsEdges]);

  const documents = useMemo(() => {
    const list = [...documentsEdges];
    list.sort((a, b) => {
      const am = structToMaps(a).map;
      const bm = structToMaps(b).map;
      const at = Number(am.last_update || am.updated_at || am.creation_date || am.created_at || 0);
      const bt = Number(bm.last_update || bm.updated_at || bm.creation_date || bm.created_at || 0);
      return bt - at;
    });
    return list;
  }, [documentsEdges]);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Assets related to your identity
            </Typography>

            {/* metadati sempre visibili */}
            <Box>
              <Typography variant="caption" sx={{ display: "block" }}>
                network: <span style={{ fontFamily: "monospace" }}>{network}</span>
              </Typography>
              <Typography variant="caption" sx={{ display: "block" }}>
                owner address: <span style={{ fontFamily: "monospace" }}>{ownerAddress}</span>
              </Typography>
              <Typography variant="caption" sx={{ display: "block" }}>
                did: <span style={{ fontFamily: "monospace" }}>{myDid}</span>
              </Typography>
              <Typography variant="caption" sx={{ display: "block" }}>
                OIDObject type: <span style={{ fontFamily: "monospace" }}>{OIDObjectType || "—"}</span>
              </Typography>
              <Typography variant="caption" sx={{ display: "block" }}>
                OIDDocument type: <span style={{ fontFamily: "monospace" }}>{OIDDocumentType || "—"}</span>
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button className="primary" variant="contained" onClick={fetchAll} disabled={loading}>
                Refresh
              </Button>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {loading ? "Loading…" : `${objects.length} objects • ${documents.length} documents`}
              </Typography>
            </Stack>

            {err && <Alert severity="error">{err}</Alert>}

            {loading ? (
              <Typography variant="body2">Loading…</Typography>
            ) : (
              <>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                    Objects
                  </Typography>
                  {objects.length === 0 ? (
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      No objects found.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {objects.map((o) => (
                        <ObjSummary key={o.node.address} edge={o} myDid={String(myDid ?? "")} />
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box sx={{ pt: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                    Documents
                  </Typography>
                  {documents.length === 0 ? (
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      No documents found.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {documents.map((d) => (
                        <DocSummary key={d.node.address} edge={d} myDid={String(myDid ?? "")} />
                      ))}
                    </Stack>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
