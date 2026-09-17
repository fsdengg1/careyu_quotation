import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../services/quotationApi";
import { formatINR } from "../utils/currency";
import { formatShortDate } from "../utils/dateFormat";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.get().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (!stats) return <div className="panel">{error || "Loading dashboard…"}</div>;

  const cards = [
    ["Total Quotations", stats.totalQuotations],
    ["Draft Quotations", stats.draftQuotations],
    ["Generated Quotations", stats.generatedQuotations],
    ["This Month", stats.thisMonthQuotations],
    ["Total Quotation Value", formatINR(stats.totalQuotationValue)],
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Quotation Studio</h1>
          <p>CARE YU AUTOMATION PVT LTD. — create, preview and issue branded A4 quotations.</p>
        </div>
        <Link className="btn btn-primary" to="/quotations/new">
          Create Quotation
        </Link>
      </div>
      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Recent quotations</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quotation No.</th>
                <th>Date</th>
                <th>Project</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recent || []).map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`/quotations/${row.id}`}>{row.quotationNumber}</Link>
                  </td>
                  <td>{formatShortDate(row.quotationDate)}</td>
                  <td>{row.projectName}</td>
                  <td>{row.clientCompany}</td>
                  <td>{formatINR(row.grandTotal)}</td>
                  <td>
                    <span className={`badge ${row.status}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
