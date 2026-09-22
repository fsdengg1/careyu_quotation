import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../services/quotationApi";
import { formatINR } from "../utils/currency";
import { formatShortDate } from "../utils/dateFormat";
import Icon from "../components/ui/Icon";
import StatePanel from "../components/ui/StatePanel";

const CARDS = [
  ["totalQuotations", "Total quotations", "file", "tone-blue"],
  ["draftQuotations", "Drafts", "pencil", "tone-slate"],
  ["generatedQuotations", "Generated", "check", "tone-green"],
  ["thisMonthQuotations", "This month", "calendar", "tone-amber"],
  ["totalQuotationValue", "Quotation value", "receipt", "tone-navy"],
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.get().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (!stats) return <StatePanel error={error}>Loading dashboard…</StatePanel>;

  const recent = stats.recent || [];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-kicker">Overview</p>
          <h1>Dashboard</h1>
          <p>Care Yu Automation — drafts, issued quotations and the value currently on file.</p>
        </div>
        <div className="page-head-actions">
          <Link className="btn btn-ghost" to="/quotations">
            All quotations
          </Link>
          <Link className="btn btn-primary" to="/quotations/new">
            New quotation
          </Link>
        </div>
      </div>
      <div className="stat-grid">
        {CARDS.map(([key, label, icon, tone]) => (
          <div className={`stat-card ${tone}`} key={key}>
            <div className="stat-icon">
              <Icon name={icon} />
            </div>
            <span>{label}</span>
            <strong>{key === "totalQuotationValue" ? formatINR(stats[key]) : stats[key]}</strong>
          </div>
        ))}
      </div>
      <div className="panel panel-flush">
        <div className="panel-head">
          <div>
            <h2>Recent quotations</h2>
            <p>The latest documents opened from the studio.</p>
          </div>
          <Link className="btn btn-ghost btn-sm" to="/quotations">
            View all
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quotation no.</th>
                <th>Date</th>
                <th>Project</th>
                <th>Client</th>
                <th className="col-money">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length ? (
                recent.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="record-link" to={`/quotations/${row.id}`}>
                        {row.quotationNumber}
                      </Link>
                    </td>
                    <td>{formatShortDate(row.quotationDate)}</td>
                    <td className="cell-clip" title={row.projectName}>{row.projectName}</td>
                    <td className="cell-clip" title={row.clientCompany}>{row.clientCompany}</td>
                    <td className="col-money">{formatINR(row.grandTotal)}</td>
                    <td>
                      <span className={`badge ${row.status}`}>{row.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-cell" colSpan={6}>
                    <div className="empty-state">
                      <strong>No quotations yet</strong>
                      <p>Create the first quotation to see it listed here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
