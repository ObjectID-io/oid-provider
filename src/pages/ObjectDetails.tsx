// src/pages/ObjectDetails.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";

import { useOid } from "../sdk/ObjectId";
import OIDQRCode from "../components/OIDQRCode";
import MediaPreview from "../components/MediaPreview";
import { initIdentityWasm } from "../utils/validateDID";
import { validateObject } from "../utils/validateObject";
import { validateDocument } from "../utils/validateDocument";

type Kind = "object" | "document";

/* =========================
   HELPERS (come i tuoi)
========================= */
function getTypeRepr(o: any): string {
  const rpcType = o?.data?.content?.type ?? o?.data?.type ?? o?.type;
  const gqlType = o?.node?.asMoveObject?.contents?.type?.repr ?? o?.asMoveObject?.contents?.type?.repr;
  return String(rpcType ?? gqlType ?? "");
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

function getFieldsMap(o: any): Record<string, any> {
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

function structToMap(moveObj: any): Record<string, any> {
  const struct = moveObj?.asMoveObject?.contents?.data?.Struct || moveObj?.contents?.data?.Struct || [];
  const out: Record<string, any> = {};
  for (const f of struct) out[f.name] = extractMoveValue(f.value);
  return out;
}

function firstNonEmpty(...vals: any[]): any {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s.length > 0) return v;
  }
  return "";
}

function formatEpoch(v: any): string {
  if (v === undefined || v === null || v === "") return "";
  const n = typeof v === "number" ? v : Number(String(v));
  if (!Number.isFinite(n) || n <= 0) return "";
  const ms = n < 1e12 ? n * 1000 : n;
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isDocType(typeRepr: string) {
  return String(typeRepr).includes("::oid_document::OIDDocument");
}
function isObjType(typeRepr: string) {
  return String(typeRepr).includes("::oid_object::OIDObject");
}

/* =========================
   COMPONENT (NO async)
========================= */
export default function ObjectDetails() {
  const oid = useOid();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();

  const session = useMemo(() => oid.session.raw(), [oid]);
  const sessionNetwork = String(session.network ?? "testnet");

  // config async -> state
  const [officialPackages, setOfficialPackages] = useState<string[]>([]);
  const [cfgError, setCfgError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await oid.session.config();
        if (!cancelled) setOfficialPackages(cfg.officialPackages ?? []);
      } catch (e: any) {
        if (!cancelled) setCfgError(e?.message ?? String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [oid]);

  // ID: da route param /object/:id, oppure da query ?oid=, oppure da navigation state
  const idFromRoute = params.id ? decodeURIComponent(params.id) : "";
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const idFromQuery = searchParams.get("oid") ?? "";
  const idFromState = (location.state as any)?.id ? String((location.state as any).id) : "";
  const objectId = (idFromRoute || idFromQuery || idFromState).trim();

  // network: query ?n=, state.network, altrimenti session.network
  const nFromQuery = searchParams.get("n");
  const network =
    String((location.state as any)?.network ?? "") || String(nFromQuery ?? "") || sessionNetwork || "testnet";

  // kind: state.kind se presente, altrimenti autodetect da type
  const kindFromState = (location.state as any)?.kind as Kind | undefined;

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  type ValidationResult = {
    check: boolean[];
    checkMsg: string[];
    checked?: boolean;
    distance?: number;
  };

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [valError, setValError] = useState<string | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // oggetto letto via provider
  const [moveObj, setMoveObj] = useState<any | null>(null);
  const [kind, setKind] = useState<Kind | null>(kindFromState ?? null);

  useEffect(() => {
    if (!objectId) return;
    if (!kind) return;
    if (!officialPackages.length) return;

    let cancelled = false;

    (async () => {
      setValidation(null);
      setValError(null);

      await initIdentityWasm();

      try {
        const r =
          kind === "object"
            ? await validateObject(objectId, officialPackages, network)
            : await validateDocument(objectId, officialPackages, network);
        if (!cancelled) setValidation(r);
      } catch (e: any) {
        if (!cancelled) setValError(e?.message ?? String(e));
        if (!cancelled) setValidation({ check: [], checkMsg: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [objectId, kind, network, officialPackages]);

  const load = useCallback(async () => {
    if (!objectId) {
      setStatus("error");
      setError("Missing object/document id.");
      return;
    }

    setStatus("loading");
    setError(null);
    setMoveObj(null);

    try {
      const o = await oid.getObject(objectId, network);

      if (!o) throw new Error("Object not found.");

      setMoveObj(o);

      const typeRepr = getTypeRepr(o);
      if (kindFromState) setKind(kindFromState);
      else if (isDocType(typeRepr)) setKind("document");
      else if (isObjType(typeRepr)) setKind("object");
      else setKind(null);

      setStatus("ok");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? String(e));
    }
  }, [objectId, oid, network, kindFromState]);

  useEffect(() => {
    load();
  }, [load]);

  const typeRepr = useMemo(() => {
    if (!moveObj) return "(unknown type)";
    return String(moveObj?.asMoveObject?.contents?.type?.repr ?? moveObj?.type?.repr ?? "(unknown type)");
  }, [moveObj]);

  const fields = useMemo(() => (moveObj ? getFieldsMap(moveObj) : {}), [moveObj]);

  const updatedFmt = useMemo(() => {
    const updatedRaw = firstNonEmpty(fields.last_update, fields.updated_at, fields.updatedAt, "");
    return formatEpoch(updatedRaw);
  }, [fields]);

  const title = useMemo(() => {
    if (!moveObj) return "";
    if (kind === "object") return firstNonEmpty(fields.name, fields.title, fields.description, "Object");
    if (kind === "document")
      return firstNonEmpty(fields.title, fields.name, fields.document_name, fields.description, "Document");
    return firstNonEmpty(fields.title, fields.name, fields.description, "Asset");
  }, [moveObj, kind, fields]);

  const previewUrl = useMemo(() => {
    if (!moveObj) return "";
    if (kind === "object") {
      return String(
        firstNonEmpty(
          fields.product_img_url,
          fields.image_url,
          fields.media_url,
          fields.img_url,
          fields.url,
          fields.uri,
          ""
        ) ?? ""
      ).trim();
    }
    return String(
      firstNonEmpty(
        fields.url,
        fields.uri,
        fields.resource_url,
        fields.content_url,
        fields.file_url,
        fields.media_url,
        fields.pdf_url,
        fields.document_url,
        ""
      ) ?? ""
    ).trim();
  }, [moveObj, kind, fields]);

  const qrValue = useMemo(() => {
    const base = window.location.origin;
    const enc = encodeURIComponent(objectId);
    return network === "mainnet" ? `${base}/?oid=${enc}` : `${base}/?n=${encodeURIComponent("testnet")}&oid=${enc}`;
  }, [objectId, network]);

  if (status === "loading") {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">Loading…</Typography>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box sx={{ p: 2, maxWidth: 1000, mx: "auto" }}>
        <Stack spacing={2}>
          <Alert severity="error">{error}</Alert>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>
      </Box>
    );
  }

  if (!moveObj) return null;

  return (
    <Box sx={{ p: 2, maxWidth: 1000, mx: "auto" }}>
      <Stack spacing={2}>
        {cfgError && <Alert severity="warning">Config error: {cfgError}</Alert>}

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="contained" onClick={load}>
            Refresh
          </Button>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            network: <span style={{ fontFamily: "monospace" }}>{network}</span>
          </Typography>
        </Stack>

        {/* HEADER */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {String(title)}
                </Typography>
                <Chip size="small" label={kind ?? "unknown"} />
              </Stack>

              <Typography variant="caption" sx={{ opacity: 0.8, wordBreak: "break-all" }}>
                {typeRepr}
              </Typography>

              <Divider />

              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                <b>ID:</b> {objectId}
              </Typography>

              {updatedFmt && (
                <Typography variant="body2">
                  <b>Updated:</b> {updatedFmt}
                </Typography>
              )}

              <Divider />

              <OIDQRCode data={qrValue} size={260} maxWidth={320} />

              {previewUrl && (
                <>
                  <Divider />
                  <MediaPreview url={previewUrl} height={520} />
                  <Typography variant="caption" sx={{ opacity: 0.8, wordBreak: "break-all" }}>
                    Source: {previewUrl}
                  </Typography>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* VALIDATION */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
              Validation
            </Typography>

            <Card variant="outlined">
              <CardContent>
                {!validation ? (
                  <Typography variant="body2">Validating…</Typography>
                ) : (
                  (() => {
                    const totalChecks = validation.check.length;
                    const passedChecks = validation.check.filter(Boolean).length;
                    const hasHardError = validation.check.some((c) => !c);

                    const summaryIcon = hasHardError ? "❌" : "✅";
                    const summaryTitle = hasHardError ? "Some checks failed" : "All checks passed";
                    const summarySubtitle =
                      totalChecks > 0 ? `${passedChecks}/${totalChecks} checks passed` : "No checks";

                    const bgcolor = hasHardError ? "error.light" : "success.light";
                    const detailsButtonDisabled = totalChecks === 0;

                    return (
                      <>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor,
                            color: "#fff",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.25,
                            minHeight: { xs: 160, sm: 130 },
                            boxSizing: "border-box",
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="h6" sx={{ color: "#fff", m: 0 }}>
                              Validation:
                            </Typography>

                            <Box
                              sx={{
                                width: 32,
                                minWidth: 32,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Typography component="span" sx={{ fontSize: 24, lineHeight: 1 }}>
                                {summaryIcon}
                              </Typography>
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#fff" }} noWrap>
                                {summaryTitle}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#fff", mt: 0.25 }}>
                                {summarySubtitle}
                              </Typography>
                            </Box>
                          </Stack>

                          {valError && (
                            <Typography variant="body2" sx={{ color: "#fff" }}>
                              Error: {valError}
                            </Typography>
                          )}

                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              alignSelf: "flex-start",
                              color: "#fff",
                              borderColor: "#fff",
                              backgroundColor: "transparent",
                              "&:hover": { color: "#fff", borderColor: "#fff", backgroundColor: "transparent" },
                            }}
                            disabled={detailsButtonDisabled}
                            onClick={() => setShowValidationDetails(true)}
                          >
                            View validation details
                          </Button>
                        </Box>

                        <Dialog
                          open={showValidationDetails}
                          onClose={() => setShowValidationDetails(false)}
                          fullWidth
                          maxWidth="sm"
                          PaperProps={{
                            sx: {
                              m: 0,
                              position: "fixed",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              borderTopLeftRadius: 16,
                              borderTopRightRadius: 16,
                            },
                          }}
                        >
                          <DialogTitle
                            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}
                          >
                            Validation details
                            <IconButton size="small" onClick={() => setShowValidationDetails(false)}>
                              ✕
                            </IconButton>
                          </DialogTitle>

                          <DialogContent dividers>
                            <Table size="small">
                              <TableBody>
                                {validation.check.map((c, i) => {
                                  const msg = validation.checkMsg[i] || "";
                                  const icon = c ? "✅" : "❌";
                                  return (
                                    <TableRow
                                      key={i}
                                      sx={{
                                        "& td": { borderBottom: "none", paddingY: 0.75 },
                                      }}
                                    >
                                      <TableCell sx={{ fontWeight: "bold", width: "5%" }}>{icon}</TableCell>
                                      <TableCell sx={{ fontSize: "0.95rem" }}>{msg}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </DialogContent>

                          <DialogActions>
                            <Button onClick={() => setShowValidationDetails(false)}>Close</Button>
                          </DialogActions>
                        </Dialog>
                      </>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* FIELDS TABLE */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
              Data
            </Typography>

            <Table size="small">
              <TableBody>
                {Object.keys(fields)
                  .sort()
                  .map((k) => (
                    <TableRow key={k}>
                      <TableCell sx={{ width: 260, verticalAlign: "top" }}>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {k}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ wordBreak: "break-all" }}>
                        <Typography variant="body2">
                          {typeof (fields as any)[k] === "object"
                            ? JSON.stringify((fields as any)[k])
                            : String((fields as any)[k])}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
