import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppState, type AppConfig } from "../state/AppState";
import type { Network } from "@objectid/objectid-provider";
import { useOidCtx } from "../sdk/ObjectId";

type LocationState = { from?: string };

function deduceNetworkFromDid(did: string): Network {
  const s = (did ?? "").trim();
  if (!s) throw new Error("DID is required.");

  if (s.startsWith("did:iota:testnet:")) return "testnet";
  if (s.startsWith("did:iota:")) return "mainnet";

  throw new Error('Invalid DID. Expected "did:iota:..." or "did:iota:testnet:...".');
}

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const { config: stored, setConfig, isReady } = useAppState();
  const { connect, status, error } = useOidCtx();

  const [did, setDid] = useState(stored?.did ?? "");
  const [seed, setSeed] = useState(stored?.seed ?? "");
  const [err, setErr] = useState<string | null>(null);

  const from = useMemo(() => {
    const st = (loc.state as LocationState | null) ?? null;
    return st?.from ?? "/objects";
  }, [loc.state]);

  if (isReady && stored && status === "ready") return <Navigate to={from} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const didTrim = did.trim();
      const seedTrim = seed.trim();

      if (!didTrim) throw new Error("DID is required.");
      if (!seedTrim) throw new Error("Seed is required.");

      const network = deduceNetworkFromDid(didTrim);

      const cfg: AppConfig = {
        network,
        seed: seedTrim,
        did: didTrim,
      };

      setConfig(cfg);

      await connect({ network, seed: seedTrim, did: didTrim });

      nav(from, { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Login / Configuration</h2>

      <p className="small">Network is deduced from the DID (did:iota:testnet:* → testnet, did:iota:* → mainnet).</p>

      {(err || error) && <p className="error">{err ?? error}</p>}

      <form onSubmit={onSubmit}>
        <div className="row">
          <div className="col">
            <label>Identity DID</label>
            <input
              value={did}
              onChange={(e) => setDid(e.target.value)}
              placeholder="did:iota:testnet:... or did:iota:..."
              autoComplete="username"
            />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <div className="col">
            <label>Seed (hex)</label>
            <input
              type="password"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="64 hex chars"
              autoComplete="current-password"
            />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <button className="primary" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Connecting…" : "Save & Connect"}
        </button>
      </form>
    </div>
  );
}
