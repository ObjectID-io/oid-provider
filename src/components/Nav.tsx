import { Link, useLocation } from "react-router-dom";

export default function Nav() {
  const loc = useLocation();
  const isActive = (path: string) => (loc.pathname === path ? "navlink active" : "navlink");

  return (
    <nav className="nav">
      <Link className={isActive("/objects")} to="/objects">Objects</Link>
      <Link className={isActive("/objects/new")} to="/objects/new">New Object</Link>
      <Link className={isActive("/config")} to="/config">Config</Link>
      <span className="spacer" />
      <Link className={isActive("/logout")} to="/logout">Logout</Link>
    </nav>
  );
}
