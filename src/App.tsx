import { Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import RequireLogin from "./components/RequireLogin";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import ObjectsPage from "./pages/ObjectsPage";
import CreateObjectPage from "./pages/CreateObjectPage";
import ConfigPage from "./pages/ConfigPage";
import { useAppState } from "./state/AppState";
import ObjectDetails from "./pages/ObjectDetails";

function HomeRedirect() {
  const { isReady, config } = useAppState();
  if (!isReady) return null;
  return <Navigate to={config ? "/objects" : "/login"} replace />;
}

export default function App() {
  return (
    <div className="container">
      <Nav />

      <div style={{ height: 12 }} />

      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />

        <Route
          path="/objects"
          element={
            <RequireLogin>
              <ObjectsPage />
            </RequireLogin>
          }
        />

        <Route
          path="/objects/new"
          element={
            <RequireLogin>
              <CreateObjectPage />
            </RequireLogin>
          }
        />

        <Route
          path="/config"
          element={
            <RequireLogin>
              <ConfigPage />
            </RequireLogin>
          }
        />

        <Route path="/object/:id" element={<ObjectDetails />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
