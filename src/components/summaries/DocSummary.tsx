// src/components/summaries/DocSummary.tsx
import { useMemo, useCallback } from "react";
import { Card, CardContent, Chip, Divider, Stack, Typography, Button } from "@mui/material";
import OIDQRCode from "../OIDQRCode";
import { MoveEdge, didEq, extractDidList, firstNonEmpty, formatEpoch, structToMaps } from "./moveHelpers";
import { useOid } from "../../sdk/ObjectId";
import { useNavigate } from "react-router-dom";

export default function DocSummary({ edge, myDid }: { edge: MoveEdge; myDid: string }) {
  const { raw, map } = structToMaps(edge);

  const id = edge.node.address;

  const oid = useOid();
  const network = oid.session.raw().network ?? "testnet";

  const navigate = useNavigate();

  const handleSelect = useCallback(() => {
    // route placeholder: la creeremo quando implementiamo ObjectDetails.tsx
    // Consiglio: /object/:id oppure /details/:id
    navigate(`/object/${encodeURIComponent(id)}`, {
      state: { id, kind: "document", network },
    });
  }, [navigate, id, network]);

  const title = firstNonEmpty(map.title, map.name, map.document_name, map.description, "Document");
  const owner = firstNonEmpty(map.owner_did, map.owner, "");
  const creator = firstNonEmpty(map.creator_did, map.creator, "");
  const publisher = firstNonEmpty(map.publisher_did, map.publisher, "");

  const editors = extractDidList(raw.editors_dids ?? raw.editors);
  const approvers = extractDidList(raw.approvers_dids ?? raw.approvers);

  const myRoles: string[] = [];
  if (didEq(myDid, owner)) myRoles.push("owner");
  if (didEq(myDid, creator)) myRoles.push("creator");
  if (didEq(myDid, publisher)) myRoles.push("publisher");
  if (editors.some((d) => didEq(d, myDid))) myRoles.push("editor");
  if (approvers.some((d) => didEq(d, myDid))) myRoles.push("approver");

  const typeRepr = edge.node.asMoveObject?.contents?.type?.repr ?? "(unknown type)";

  const updatedRaw = firstNonEmpty(map.last_update, map.updated_at, map.updatedAt, "");
  const updatedFmt = formatEpoch(updatedRaw);

  const qrValue = useMemo(() => {
    const base = window.location.origin;
    const enc = encodeURIComponent(id);
    return network === "mainnet" ? `${base}/?oid=${enc}` : `${base}/?n=${encodeURIComponent("testnet")}&oid=${enc}`;
  }, [id, network]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {String(title)}
            </Typography>
            {myRoles.map((r) => (
              <Chip key={r} size="small" label={r} />
            ))}

            {/* action */}
            <Button size="small" variant="outlined" onClick={handleSelect} sx={{ ml: "auto" }}>
              Select
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ opacity: 0.8, wordBreak: "break-all" }}>
            {typeRepr}
          </Typography>

          <Divider />

          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            <b>ID:</b> {id}
          </Typography>

          <Typography variant="body2">
            <b>Editors:</b> {editors.length} &nbsp; <b>Approvers:</b> {approvers.length}
            {updatedFmt ? (
              <>
                {" "}
                &nbsp; <b>Updated:</b> {updatedFmt}
              </>
            ) : null}
          </Typography>

          {(owner || creator || publisher) && (
            <Stack spacing={0.25}>
              {owner && (
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  <b>Owner:</b> {String(owner)}
                </Typography>
              )}
              {creator && (
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  <b>Creator:</b> {String(creator)}
                </Typography>
              )}
              {publisher && (
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  <b>Publisher:</b> {String(publisher)}
                </Typography>
              )}
            </Stack>
          )}

          <OIDQRCode data={qrValue} size={260} maxWidth={320} />
        </Stack>
      </CardContent>
    </Card>
  );
}
