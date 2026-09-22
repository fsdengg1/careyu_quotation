import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../ui/Icon";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/quotations", label: "Quotations", icon: "file" },
  { to: "/quotations/new", label: "New quotation", icon: "plus" },
  { to: "/customers", label: "Customers", icon: "users" },
  { to: "/settings", label: "Settings", icon: "sliders" },
];

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase()).join("");
  return letters || "CY";
}

function BrandMark() {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="brand-fallback">CY</span>;
  return <img src="/assets/careyu-logo.png" alt="" onError={() => setFailed(true)} />;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {open ? (
        <button className="sidebar-backdrop" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <BrandMark />
          <div>
            <strong>Care Yu</strong>
            <span>Quotation studio</span>
          </div>
        </div>
        <div>
          <p className="nav-label">Workspace</p>
          <nav>
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={() => {
                  const path = location.pathname;
                  const active =
                    link.to === "/quotations"
                      ? path === "/quotations" || /^\/quotations\/(?!new(?:\/|$))[^/]+/.test(path)
                      : path === link.to;
                  return `nav-link ${active ? "active" : ""}`;
                }}
              >
                <Icon name={link.icon} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar">{initials(user?.name)}</span>
            <div>
              <strong>{user?.name || "Signed in"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button
            className="signout"
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button className="menu-btn icon-btn" type="button" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="topbar-title">
            <strong>Care Yu Automation</strong>
            <span>Quotations, customers and company settings</span>
          </div>
          <div className="topbar-meta">
            {user?.role ? <span className="role-pill">{user.role}</span> : null}
            <span>{user?.name}</span>
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
