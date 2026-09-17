import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { quotationApi } from "../services/quotationApi";
import { formatINR } from "../utils/currency";
import { formatShortDate } from "../utils/dateFormat";

export default function Quotations() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", client: "", from: "", to: "" });
  const [error, setError] = useState("");

  async function load(next = filters) {
    try {
      const data = await quotationApi.list(next);
      setRows(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function duplicate(id) {
    navigate(`/quotations/${id}/duplicate`);
  }

  async function remove(id) {
    if (!window.confirm("Delete this quotation?")) return;
    await quotationApi.remove(id);
    load();
  }

  async function download(id, number) {
    const blob = await quotationApi.downloadPdf(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Quotations</h1>
          <p>Search, filter, duplicate and download issued Care Yu quotations.</p>
        </div>
        <Link className="btn btn-primary" to="/quotations/new">
          Create Quotation
        </Link>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="panel">
        <div className="filters">
          <input
            placeholder="Search number, project or client"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <input
            placeholder="Client"
            value={filters.client}
            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
          />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {["draft", "generated", "sent", "approved", "rejected", "cancelled"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <button className="btn btn-dark" type="button" onClick={() => load(filters)}>
            Apply
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quotation No.</th>
                <th>Date</th>
                <th>Project Name</th>
                <th>Client</th>
                <th>Location</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.quotationNumber}</td>
                  <td>{formatShortDate(row.quotationDate)}</td>
                  <td>{row.projectName}</td>
                  <td>{row.clientCompany}</td>
                  <td>{row.projectLocation}</td>
                  <td>{formatINR(row.grandTotal)}</td>
                  <td>
                    <span className={`badge ${row.status}`}>{row.status}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn btn-ghost" to={`/quotations/${row.id}`}>
                        View
                      </Link>
                      <Link className="btn btn-ghost" to={`/quotations/${row.id}/edit`}>
                        Edit
                      </Link>
                      <button className="btn btn-ghost" type="button" onClick={() => duplicate(row.id)}>
                        Duplicate
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => download(row.id, row.quotationNumber)}>
                        PDF
                      </button>
                      <Link className="btn btn-ghost" to={`/quotations/${row.id}/print`} target="_blank">
                        Print
                      </Link>
                      <button className="btn btn-danger" type="button" onClick={() => remove(row.id)}>
                        Delete
                      </button>
                    </div>
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
