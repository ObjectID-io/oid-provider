import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOid } from "../sdk/ObjectId";

function parseJsonOrString(raw: string): unknown {
  const t = raw.trim();
  if (!t) return {};
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

export default function CreateObjectPage() {
  const oid = useOid();
  const nav = useNavigate();

  const [objectType, setObjectType] = useState("default");
  const [productUrl, setProductUrl] = useState("");
  const [productImgUrl, setProductImgUrl] = useState("");
  const [description, setDescription] = useState("");
  const [opCode, setOpCode] = useState("");
  const [immutableMetadata, setImmutableMetadata] = useState("{}");
  const [mutableMetadata, setMutableMetadata] = useState("{}");
  const [geoLocation, setGeoLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [credit, setCredit] = useState<string | null>(null);

  const session = useMemo(() => oid.session.raw(), [oid]);

  const creditTokens = session.creditTokens ?? [];
  const activeCreditToken = session.activeCreditToken ?? creditTokens[0] ?? "";
  const oidControllerCap = session.oidControllerCap ?? "";

  useEffect(() => {
    // ensure active token is set
    try {
      if (activeCreditToken) oid.session.creditToken(activeCreditToken);
    } catch {
      // ignore
    }
    // load current credit
    (async () => {
      try {
        const c = await oid.session.credit();
        setCredit(c);
      } catch {
        setCredit(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCreditToken]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!activeCreditToken) return setErr("No credit token found for this address.");
    if (!oidControllerCap) return setErr("OID ControllerCap not found for the provided DID.");

    setLoading(true);
    try {
      const r = await (oid as any).create_object({
        creditToken: activeCreditToken,
        OIDcontrollerCap: oidControllerCap,

        object_type: objectType,
        product_url: productUrl,
        product_img_url: productImgUrl,
        description,
        op_code: opCode,
        immutable_metadata: parseJsonOrString(immutableMetadata),
        mutable_metadata: parseJsonOrString(mutableMetadata),
        geo_location: geoLocation,
      });

      if (!r?.success) {
        setErr(String(r?.error ?? r?.status?.error ?? "Transaction failed"));
        return;
      }

      setOk(`Success. txDigest: ${r.txDigest}${r.createdObjectId ? " | object: " + r.createdObjectId : ""}`);

      // refresh credit shown
      try {
        const c = await oid.session.credit();
        setCredit(c);
      } catch {
        // ignore
      }
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Create Object (Direct)</h2>
      <p className="small">Builds and executes the Move transaction directly in the browser (no backend).</p>

      {err && <p className="error">{err}</p>}
      {ok && <p className="success">{ok}</p>}

      <div className="small" style={{ marginBottom: 12, opacity: 0.9 }}>
        <div>
          IOTA address: <span className="mono">{session.address}</span>
        </div>
        <div>
          DID: <span className="mono">{session.did}</span>
        </div>
        <div>
          OID ControllerCap: <span className="mono">{oidControllerCap || "—"}</span>
        </div>
        <div>
          Active creditToken: <span className="mono">{activeCreditToken || "—"}</span>
        </div>
        <div>
          Credit: <span className="mono">{credit ?? "—"}</span>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="row">
          <div className="col">
            <label>Credit token</label>
            <select
              value={activeCreditToken}
              onChange={(e) => {
                try {
                  oid.session.creditToken(e.target.value);
                  setCredit(null);
                } catch (err: any) {
                  setErr(err?.message ?? String(err));
                }
              }}
              disabled={loading}
            >
              {creditTokens.length === 0 ? (
                <option value="">No tokens</option>
              ) : (
                creditTokens.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="col">
            <label>Object Type</label>
            <input value={objectType} onChange={(e) => setObjectType(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <div className="col">
            <label>Op Code</label>
            <input value={opCode} onChange={(e) => setOpCode(e.target.value)} />
          </div>
          <div className="col">
            <label>Geo Location</label>
            <input value={geoLocation} onChange={(e) => setGeoLocation(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <div className="col">
            <label>Product URL</label>
            <input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="col">
            <label>Product Image URL</label>
            <input value={productImgUrl} onChange={(e) => setProductImgUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <div className="col">
            <label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <div className="col">
            <label>Immutable Metadata (JSON)</label>
            <textarea value={immutableMetadata} onChange={(e) => setImmutableMetadata(e.target.value)} />
          </div>
          <div className="col">
            <label>Mutable Metadata (JSON)</label>
            <textarea value={mutableMetadata} onChange={(e) => setMutableMetadata(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div className="row" style={{ justifyContent: "space-between" }}>
          <button type="button" onClick={() => nav("/objects")} disabled={loading}>
            Back to list
          </button>
          <button className="primary" type="submit" disabled={loading || !activeCreditToken || !oidControllerCap}>
            {loading ? "Submitting..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
