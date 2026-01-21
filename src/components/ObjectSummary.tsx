import React, { useCallback, useState } from "react";
import { Box, Stack, Typography, useMediaQuery, useTheme, IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { ObjectData } from "../types/objectData";
import MediaPreview from "./MediaPreview";

type SnackState = {
  open: boolean;
  severity: "success" | "info" | "warning" | "error";
  message: string;
};

export default function ObjectSummary({
  data,
  short,
  onClick,
}: {
  data: ObjectData;
  short?: boolean;
  onClick?: () => void;
}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [snack, setSnack] = useState<SnackState>({
    open: false,
    severity: "info",
    message: "",
  });

  const openSnack = useCallback((severity: SnackState["severity"], message: string) => {
    setSnack({ open: true, severity, message });
  }, []);

  const closeSnack = useCallback((_?: any, reason?: string) => {
    if (reason === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  }, []);

  if (!data || !data.fields) return <div>No object data.</div>;

  const { id, fields } = data;

  const description = fields.description || "No description provided";

  const createdAt = fields.creation_date
    ? new Date(Number(fields.creation_date)).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  const updatedAt = fields.last_update
    ? new Date(Number(fields.last_update)).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  const mediaUrl = fields.product_img_url;

  function shortenObj(obj: string) {
    if (!obj) return "";
    if (isSmallScreen) return `${obj.slice(0, 10)}...${obj.slice(-10)}`;
    return obj;
  }

  const handleCopyId = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation(); // evita onClick del box padre
      try {
        await navigator.clipboard.writeText(id);
        openSnack("success", "Object ID copied");
      } catch (err: any) {
        openSnack("error", err?.message ?? "Copy failed");
      }
    },
    [id, openSnack]
  );

  return (
    <Box
      className="box-panel"
      onClick={onClick}
      sx={{
        mb: 2,
        display: "flex",
        gap: 2,
        flexWrap: "wrap",
        alignItems: "flex-start",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
        <Stack direction={isSmallScreen ? "column" : "row"} spacing={2} sx={{ width: "100%" }}>
          <Stack direction="column" spacing={2} sx={{ width: "100%" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold" }}>
                Object ID: {shortenObj(id)}
              </Typography>

              <Tooltip title="Copy full Object ID">
                <IconButton size="small" onClick={handleCopyId} sx={{ mt: "-6px" }} aria-label="copy object id">
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold" }}>
                Description:
              </Typography>
              <Typography sx={{ mb: 2, wordBreak: "break-all" }}>{description}</Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold" }}>
                Type:
              </Typography>
              <Typography sx={{ mb: 2, wordBreak: "break-all" }}>{fields.object_type ?? "Unknown"}</Typography>
            </Stack>

            <Stack direction={isSmallScreen ? "column" : "row"} spacing={2} sx={{ width: "100%" }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold" }}>
                Created:
              </Typography>
              <Typography sx={{ mb: 2, wordBreak: "break-all" }}>{createdAt}</Typography>
            </Stack>

            <Stack direction={isSmallScreen ? "column" : "row"} spacing={2} sx={{ width: "100%" }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold" }}>
                Last update:
              </Typography>
              <Typography sx={{ mb: 2, wordBreak: "break-all" }}>{updatedAt}</Typography>
            </Stack>
          </Stack>

          {!short && mediaUrl && typeof mediaUrl === "string" && mediaUrl.startsWith("http") && (
            <Box sx={{ minWidth: 200, maxWidth: 300 }}>
              <MediaPreview url={mediaUrl} />
            </Box>
          )}
        </Stack>
      </Stack>

      <Snackbar open={snack.open} autoHideDuration={2200} onClose={closeSnack}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
