import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Brief", icon: "⌂", path: "/brief" },
  { label: "Plan", icon: "◈", path: "/plan" },
  { label: "Alerts", icon: "♢", path: "/alerts" },
  { label: "Debrief", icon: "◌", path: "/debrief" },
  { label: "War room", icon: "◉", path: "/warroom" },
];

export function AppLayout() {
  return (
    <div className="app-frame">
      <header className="top-bar">
        <Link to="/brief" className="brand-lockup" aria-label="Contingency Genius home">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>Contingency Genius</span>
        </Link>
        <Link to="/settings" className="top-settings-link" aria-label="Open settings">•••</Link>
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
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
