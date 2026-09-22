import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { quotationApi } from "../services/quotationApi";
import { downloadQuotationPdf } from "../utils/pdfDownload";
import { formatINR } from "../utils/currency";
import { formatShortDate } from "../utils/dateFormat";
import RowMenu from "../components/ui/RowMenu";
import StatePanel from "../components/ui/StatePanel";

const STATUSES = ["draft", "generated", "sent", "approved", "rejected", "cancelled"];

export default function Quotations() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", client: "", from: "", to: "" });
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [pdfState, setPdfState] = useState({ id: null, phase: "idle", seconds: 0 });

  async function load(next = filters) {
    try {
      const data = await quotationApi.list(next);
      setRows(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (pdfState.phase !== "cooldown" || pdfState.seconds <= 0) return undefined;
    const timer = setTimeout(() => {
      setPdfState((current) => {
        if (current.phase !== "cooldown") return current;
        const seconds = current.seconds - 1;
        return seconds <= 0 ? { id: null, phase: "idle", seconds: 0 } : { ...current, seconds };
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [pdfState]);

  async function remove(id) {
    if (!window.confirm("Delete this quotation?")) return;
    await quotationApi.remove(id);
    load();
  }

  async function download(id, number) {
    if (pdfState.phase === "generating") return;
    if (pdfState.phase === "cooldown" && pdfState.id === id) return;
    setError("");
    try {
      await downloadQuotationPdf(id, `${number}.pdf`, (next) => setPdfState({ id, ...next }));
    } catch (err) {
      setError(err.message);
    }
  }

  function pdfLabel(id) {
    if (pdfState.id !== id) return "Download PDF";
    if (pdfState.phase === "generating") return "Generating PDF…";
    if (pdfState.phase === "cooldown") return `Try again in ${pdfState.seconds}s`;
    return "Download PDF";
  }

  if (!loaded) return <StatePanel error={error}>Loading quotations…</StatePanel>;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-kicker">Documents</p>
          <h1>Quotations</h1>
          <p>Search the register, open a document, or start a new one from an existing quotation.</p>
        </div>
        <Link className="btn btn-primary" to="/quotations/new">
          New quotation
        </Link>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="panel panel-flush">
        <form
          className="panel-toolbar filters"
          onSubmit={(event) => {
            event.preventDefault();
            load(filters);
          }}
        >
          <label className="filter-field search">
            <span>Search</span>
            <input
              placeholder="Number, project or client"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </label>
          <label className="filter-field">
            <span>Client</span>
            <input
              placeholder="Company name"
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
            />
          </label>
          <label className="filter-field compact">
            <span>Status</span>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field compact">
            <span>From</span>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </label>
          <label className="filter-field compact">
            <span>To</span>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </label>
          <button className="btn btn-dark" type="submit">
            Apply
          </button>
        </form>
        <div className="table-wrap">
          <table className="data-table table-wide">
            <thead>
              <tr>
                <th>Quotation no.</th>
                <th>Date</th>
                <th>Project</th>
                <th>Client</th>
                <th>Location</th>
                <th className="col-money">Amount</th>
                <th>Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const busy =
                    pdfState.id === row.id && (pdfState.phase === "generating" || pdfState.phase === "cooldown");
                  return (
                    <tr key={row.id}>
                      <td>
                        <Link className="record-link" to={`/quotations/${row.id}`}>
                          {row.quotationNumber}
                        </Link>
                      </td>
                      <td>{formatShortDate(row.quotationDate)}</td>
                      <td className="cell-clip" title={row.projectName}>{row.projectName}</td>
                      <td className="cell-clip" title={row.clientCompany}>{row.clientCompany}</td>
                      <td className="cell-clip" title={row.projectLocation}>{row.projectLocation}</td>
                      <td className="col-money">{formatINR(row.grandTotal)}</td>
                      <td>
                        <span className={`badge ${row.status}`}>{row.status}</span>
                      </td>
                      <td className="col-actions">
                        <div className="row-actions end">
                          <Link className="btn btn-ghost btn-sm" to={`/quotations/${row.id}`}>
                            View
                          </Link>
                          <Link className="btn btn-ghost btn-sm" to={`/quotations/${row.id}/edit`}>
                            Edit
                          </Link>
                          <RowMenu
                            items={[
                              { label: "Duplicate", onClick: () => navigate(`/quotations/${row.id}/duplicate`) },
                              {
                                label: pdfLabel(row.id),
                                disabled: pdfState.phase === "generating" || busy,
                                onClick: () => download(row.id, row.quotationNumber),
                              },
                              { label: "Print", to: `/quotations/${row.id}/print`, target: "_blank" },
                              { label: "Delete", danger: true, onClick: () => remove(row.id) },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="empty-cell" colSpan={8}>
                    <div className="empty-state">
                      <strong>No quotations match</strong>
                      <p>Adjust the filters, or create a new quotation.</p>
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
