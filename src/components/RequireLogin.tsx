import { Navigate } from "react-router-dom";
import { useAppState } from "../state/AppState";
import { useOidStatus } from "../sdk/ObjectId";

export default function RequireLogin({ children }: { children: React.ReactNode }) {
  const { isReady, config } = useAppState();
  const { status, error } = useOidStatus();

  if (!isReady) return null;

  if (!config) return <Navigate to="/login" replace />;

  if (status === "loading") {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Loading…</h2>
        <p className="small">Initializing provider session.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Provider error</h2>
        <p className="error">{error ?? "Unknown error"}</p>
        <p className="small">Go back to Login and try again.</p>
      </div>
    );
  }

  // ready or idle (idle can happen if config missing did; RequireLogin already checks config exists)
  return <>{children}</>;
}
