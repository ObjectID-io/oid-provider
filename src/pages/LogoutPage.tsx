import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "../state/AppState";
import { useOidCtx } from "../sdk/ObjectId";

export default function LogoutPage() {
  const { setConfig } = useAppState();
  const { disconnect } = useOidCtx();

  useEffect(() => {
    disconnect();
    setConfig(null);
  }, [disconnect, setConfig]);

  return <Navigate to="/login" replace />;
}
