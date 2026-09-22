import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import EditQuotation from "./pages/EditQuotation";
import DuplicateQuotation from "./pages/DuplicateQuotation";
import ViewQuotation from "./pages/ViewQuotation";
import PrintQuotation from "./pages/PrintQuotation";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="boot-screen" role="status">
        <span className="spinner" />
        <p>Opening Care Yu…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/quotations/:id/print"
        element={
          <Protected>
            <PrintQuotation />
          </Protected>
        }
      />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotations/new" element={<CreateQuotation />} />
        <Route path="/quotations/:id/edit" element={<EditQuotation />} />
        <Route path="/quotations/:id/duplicate" element={<DuplicateQuotation />} />
        <Route path="/quotations/:id" element={<ViewQuotation />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
