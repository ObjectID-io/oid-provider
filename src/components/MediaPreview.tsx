import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Alert } from "@mui/material";

const IMAGE_PROXY_ENDPOINT = "https://api.objectid.io/api/image-proxy";

function normalizeUrl(raw: string) {
  const u = (raw || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  // se arriva senza schema, prova https
  return `https://${u}`;
}

async function fetchViaProxy(src: string): Promise<Blob> {
  const res = await fetch(IMAGE_PROXY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: src }),
  });

  if (!res.ok) {
    throw new Error(`Proxy error HTTP ${res.status}`);
  }

  return await res.blob();
}

export default function MediaPreview({ url, height }: { url: string; height?: number }) {
  const src = useMemo(() => normalizeUrl(url), [url]);
  const isImg = useMemo(() => /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(src), [src]);
  const isPdf = useMemo(() => /\.pdf(\?|#|$)/i.test(src), [src]);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProxy, setLoadingProxy] = useState<boolean>(false);

  // revoca URL locale quando cambia o su unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // PDF: fetch diretto → se errore, tenta proxy
  useEffect(() => {
    setBlobUrl(null);
    setError(null);

    if (!src || !isPdf) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        // 1) tentativo diretto
        const direct = await fetch(src, { mode: "cors" });
        if (!direct.ok) throw new Error(`HTTP ${direct.status}`);
        const blob = await direct.blob();
        if (cancelled) return;
        const local = URL.createObjectURL(blob);
        setBlobUrl(local);
      } catch (e1: any) {
        // 2) fallback via proxy
        try {
          const blob = await fetchViaProxy(src);
          if (cancelled) return;
          const local = URL.createObjectURL(blob);
          setBlobUrl(local);
        } catch (e2: any) {
          if (cancelled) return;
          setError(e2?.message || e1?.message || "Cannot load PDF");
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [src, isPdf]);

  // immagini: se <img> fallisce, tenta proxy una sola volta
  const handleImgError = useCallback(() => {
    if (!src || loadingProxy || blobUrl) {
      // già tentato o nessun src → errore finale
      setError("Image not available");
      return;
    }

    setLoadingProxy(true);
    setError(null);

    (async () => {
      try {
        const blob = await fetchViaProxy(src);
        const local = URL.createObjectURL(blob);
        setBlobUrl(local);
      } catch (e: any) {
        setError(e?.message || "Image not available");
      } finally {
        setLoadingProxy(false);
      }
    })();
  }, [src, loadingProxy, blobUrl]);

  if (!src) return null;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Immagini */}
      {isImg && !error && (
        <img
          src={blobUrl || src}
          alt="document"
          style={{
            width: "100%",
            maxWidth: "100%",
            height: height ? `${height}px` : "auto",
            maxHeight: height ? `${height}px` : undefined,
            objectFit: "contain",
            borderRadius: 8,
            display: "block",
          }}
          onError={handleImgError}
          crossOrigin="anonymous"
        />
      )}

      {/* PDF */}
      {isPdf && !error && (
        <Box
          component="iframe"
          src={blobUrl || src}
          sx={{
            width: "100%",
            height: height ?? 520,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        />
      )}

      {/* Fallback / 404 / CORS */}
      {error && (
        <Alert severity="warning" sx={{ my: 1 }}>
          Preview not available: {error}. Open the link in a browser.
        </Alert>
      )}
    </Box>
  );
}
