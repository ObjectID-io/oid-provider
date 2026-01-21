// src/components/OIDQRCode.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Snackbar, Alert } from "@mui/material";

import QRCodeStyling from "qr-code-styling";
import logo from "../assets/OID_white.png";

export type OIDQRCodeFormat = "circle" | "square";

export type OIDQRCodeProps = {
  data: string;
  format?: OIDQRCodeFormat;
  size?: number; // solo per layout
  showCopyButton?: boolean;
  copyLabel?: string;
  textTop?: string;
  textBottom?: string;
  maxWidth?: number; // contenitore, evita overflow
};

const QR_CODE_CONTAINER_DISPLAY_SIZE = 300;
const QR_CODE_DISPLAY_SIZE = 250;
const TOTAL_CONTAINER_HEIGHT = QR_CODE_CONTAINER_DISPLAY_SIZE;

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) reject(new Error("canvas.toBlob returned null"));
      else resolve(b);
    }, "image/png");
  });
}

async function svgToPngBlob(svgEl: SVGElement): Promise<Blob> {
  const svg = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG into Image"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(img.width || 1));
    canvas.height = Math.max(1, Math.floor(img.height || 1));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");

    ctx.drawImage(img, 0, 0);
    return await canvasToPngBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type SnackState = {
  open: boolean;
  severity: "success" | "info" | "warning" | "error";
  message: string;
};

function clipText(s: string) {
  // evita clipboard con stringhe enormi/invalid
  return String(s ?? "").trim();
}

export default function OIDQRCode({
  data,
  size = 240,
  showCopyButton = false,
  copyLabel = "COPY QRcode in clipboard",
  maxWidth = 320,
}: OIDQRCodeProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);

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

  const boxSx = useMemo(
    () => ({
      width: "100%",
      maxWidth,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden",
      borderRadius: 2,
      pb: 2,
    }),
    [maxWidth]
  );

  const getQrPngBlob = useCallback(async (): Promise<Blob> => {
    const root = wrapRef.current;
    if (!root) throw new Error("QR container not found");

    const canvas = root.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas) return await canvasToPngBlob(canvas);

    const svg = root.querySelector("svg") as SVGElement | null;
    if (!svg) throw new Error("No canvas/svg found inside QR container");
    return await svgToPngBlob(svg);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = clipText(data);

    try {
      // 1) prova a copiare immagine + testo nello stesso write (se supportato)
      const pngBlob = await getQrPngBlob();

      const write = (navigator as any)?.clipboard?.write;
      const writeText = (navigator as any)?.clipboard?.writeText;
      const ClipboardItemCtor = (window as any).ClipboardItem;

      if (typeof write === "function" && ClipboardItemCtor && pngBlob) {
        try {
          await (navigator as any).clipboard.write([
            new ClipboardItemCtor({
              "image/png": pngBlob,
              "text/plain": new Blob([text], { type: "text/plain" }),
            }),
          ]);
          openSnack("success", "Copied QR image + link");
          return;
        } catch {
          // continua: alcuni browser falliscono se metti text+image insieme
          try {
            await (navigator as any).clipboard.write([
              new ClipboardItemCtor({
                "image/png": pngBlob,
              }),
            ]);
            openSnack("success", "Copied QR image");
            return;
          } catch {
            // continua con testo
          }
        }
      }

      // 2) fallback: testo
      if (typeof writeText === "function") {
        await (navigator as any).clipboard.writeText(text);
        openSnack("success", "Copied link");
        return;
      }

      // 3) ultimo fallback: download immagine
      const a = document.createElement("a");
      a.href = URL.createObjectURL(pngBlob);
      a.download = "qrcode.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      openSnack("warning", "Downloaded image (clipboard not supported)");
    } catch (e: any) {
      // se fallisce immagine, prova comunque a copiare testo
      try {
        const writeText = (navigator as any)?.clipboard?.writeText;
        const text = clipText(data);
        if (typeof writeText === "function") {
          await (navigator as any).clipboard.writeText(text);
          openSnack("success", "Copied link");
          return;
        }
      } catch {
        // ignore
      }
      openSnack("error", e?.message ?? "Copy failed");
    }
  }, [data, getQrPngBlob, openSnack]);

  useEffect(() => {
    if (!qrRef.current) return;

    if (!qrCodeInstance) {
      const newQrCode = new QRCodeStyling({
        shape: "square",
        type: "svg",
        width: QR_CODE_CONTAINER_DISPLAY_SIZE,
        height: TOTAL_CONTAINER_HEIGHT,
        margin: 0,
        data,
        image: logo,
        dotsOptions: { type: "dots", color: "#000000" },
        cornersSquareOptions: { type: "dot", color: "#000000" },
        cornersDotOptions: { type: "dot", color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 5,
          imageSize: 0.4,
        },
      });

      setQrCodeInstance(newQrCode);
      qrRef.current.innerHTML = "";
      newQrCode.append(qrRef.current);
    } else {
      qrCodeInstance.update({ data });
    }
  }, [data, qrCodeInstance]);

  return (
    <Box sx={boxSx}>
      <Box
        ref={wrapRef}
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCopy();
          }
        }}
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          "& > *": { maxWidth: "100%" },
          cursor: "copy",
          userSelect: "none",
        }}
        title="Click to copy (QR image if possible, otherwise link)"
      >
        <Box sx={{ width: "100%", maxWidth: size }}>
          <Box
            ref={qrRef}
            sx={{
              width: QR_CODE_DISPLAY_SIZE,
              height: QR_CODE_CONTAINER_DISPLAY_SIZE,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          />
        </Box>
      </Box>

      {showCopyButton && (
        <Box sx={{ width: "100%", px: 2, mt: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleCopy} sx={{ py: 1.5 }}>
            {copyLabel}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
