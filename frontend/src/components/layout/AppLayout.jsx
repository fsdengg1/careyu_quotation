import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/quotations", "Quotations"],
  ["/quotations/new", "Create Quotation"],
  ["/customers", "Customers"],
  ["/settings", "Settings"],
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/assets/careyu-logo.png" alt="Care Yu" />
          <div>
            <strong>CARE YU</strong>
            <span>Quotation Studio</span>
          </div>
        </div>
        <nav>
          {LINKS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/quotations"}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>{user?.name}</div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
