// src/components/summaries/ObjSummary.tsx
import { useMemo, useCallback } from "react";
import { Card, CardContent, Chip, Divider, Stack, Typography, Button } from "@mui/material";
import MediaPreview from "../MediaPreview";
import OIDQRCode from "../OIDQRCode";
import { useNavigate } from "react-router-dom";
import { useOid } from "../../sdk/ObjectId";

import { MoveEdge, didEq, firstNonEmpty, formatEpoch, structToMaps } from "./moveHelpers";

export default function ObjSummary({ edge, myDid }: { edge: MoveEdge; myDid: string }) {
  const navigate = useNavigate();
  const oid = useOid();
  const network = oid.session.raw().network ?? "testnet";

  const { map } = structToMaps(edge);

  const id = edge.node.address;

  const handleSelect = useCallback(() => {
    navigate(`/object/${encodeURIComponent(id)}`, {
      state: { id, kind: "object", network },
    });
  }, [navigate, id, network]);

  const title = firstNonEmpty(map.name, map.title, map.description, "Object");
  const owner = firstNonEmpty(map.owner_did, map.owner, "");
  const creator = firstNonEmpty(map.creator_did, map.creator, "");
  const agent = firstNonEmpty(map.agent_did, map.agent, "");

  const myRoles: string[] = [];
  if (didEq(myDid, owner)) myRoles.push("owner");
  if (didEq(myDid, creator)) myRoles.push("creator");
  if (didEq(myDid, agent)) myRoles.push("agent");

  const typeRepr = edge.node.asMoveObject?.contents?.type?.repr ?? "(unknown type)";

  const status = firstNonEmpty(map.status, map.state, "");
  const serial = firstNonEmpty(map.serial, map.serial_number, map.sku, "");

  const updatedRaw = firstNonEmpty(map.last_update, map.updated_at, map.updatedAt, "");
  const updatedFmt = formatEpoch(updatedRaw);

  // preview url (best effort)
  const previewUrl = String(
    firstNonEmpty(map.product_img_url, map.image_url, map.media_url, map.img_url, map.url, map.uri, "") ?? ""
  ).trim();

  const qrValue = useMemo(() => {
    const base = window.location.origin;
    const enc = encodeURIComponent(id);
    return network === "mainnet" ? `${base}/?oid=${enc}` : `${base}/?n=${encodeURIComponent("testnet")}&oid=${enc}`;
  }, [id, network]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {String(title)}
              </Typography>

              {myRoles.map((r) => (
                <Chip key={r} size="small" label={r} />
              ))}

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

            {(status || serial || updatedFmt) && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {status ? `Status: ${String(status)} ` : ""}
                {serial ? `• Serial: ${String(serial)} ` : ""}
                {updatedFmt ? `• Updated: ${updatedFmt}` : ""}
              </Typography>
            )}

            {(owner || creator || agent) && (
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
                {agent && (
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    <b>Agent:</b> {String(agent)}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>

          <Divider />

          <OIDQRCode data={qrValue} size={260} maxWidth={320} />

          {previewUrl && (
            <>
              <Divider />
              <MediaPreview url={previewUrl} height={320} />
              <Typography variant="caption" sx={{ opacity: 0.8, wordBreak: "break-all" }}>
                Source: {previewUrl}
              </Typography>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
