import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "BRIEF", path: "/brief" },
  { label: "PLAN", path: "/plan" },
  { label: "ALERTS", path: "/alerts" },
  { label: "DEBRIEF", path: "/debrief" },
  { label: "WAR ROOM", path: "/warroom" },
];

export function AppLayout() {
  return (
    <div className="app-frame">
      <header className="top-bar">
        <Link to="/brief" className="brand-lockup" aria-label="Contingency Genius home">
          <span className="brand-mark">CG</span>
          <span>Contingency Genius</span>
        </Link>
        <Link to="/settings" className="top-settings-link">Settings</Link>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
