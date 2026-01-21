import { useMemo, useState } from "react";
import { useOid } from "../sdk/ObjectId";

export default function ConfigPage() {
  const oid = useOid();

  const [objectId, setObjectId] = useState("");
  const [jsonText, setJsonText] = useState(() => JSON.stringify({ network: "testnet" }, null, 2));
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const info = useMemo(() => {
    try {
      const s = oid.session.raw();
      return {
        network: s.network,
        address: s.address,
        configObjectId: s.configObjectId ?? null,
      };
    } catch {
      return null;
    }
  }, [oid]);

  async function onCopyActiveConfig() {
    setLocalErr(null);
    setBusy(true);
    try {
      const j = await oid.session.config();
      setJsonText(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setLocalErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onApplyJson() {
    setLocalErr(null);
    setBusy(true);
    try {
      const j = JSON.parse(jsonText);
      if (typeof j !== "object" || j === null || Array.isArray(j)) {
        throw new Error("Config JSON must be an object");
      }
      await oid.session.config(j as any);
    } catch (e: any) {
      setLocalErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onApplyObject() {
    setLocalErr(null);
    setBusy(true);
    try {
      if (!objectId.trim()) throw new Error("Missing Config objectId");
      await oid.session.config(objectId.trim());
    } catch (e: any) {
      setLocalErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Configuration</h2>
      <p className="small">Override the provider configuration at runtime.</p>

      {info && (
        <div className="small" style={{ marginBottom: 12 }}>
          <div>
            network: <span className="mono">{info.network}</span>
          </div>
          <div>
            address: <span className="mono">{info.address}</span>
          </div>
          <div>
            active config objectId: <span className="mono">{info.configObjectId ?? "—"}</span>
          </div>
        </div>
      )}

      {localErr && <p className="error">{localErr}</p>}

      <h3>Set config from on-chain objectId</h3>
      <div className="row">
        <div className="col">
          <label>Config objectId</label>
          <input value={objectId} onChange={(e) => setObjectId(e.target.value)} placeholder="0x..." />
        </div>
        <div className="col" style={{ alignSelf: "flex-end" }}>
          <button className="primary" onClick={onApplyObject} disabled={busy}>
            Apply Config Object
          </button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <h3>Edit config JSON</h3>
      <div className="row">
        <div className="col" />
        <div className="col" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCopyActiveConfig} disabled={busy}>
            Copy active config
          </button>
        </div>
      </div>

      <label>JSON</label>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={12}
        style={{ width: "100%", fontFamily: "monospace" }}
      />

      <div style={{ height: 8 }} />
      <button className="primary" onClick={onApplyJson} disabled={busy}>
        Apply JSON
      </button>
    </div>
  );
}
