import { useEffect, useState } from "react";
import { customerApi } from "../services/quotationApi";
import StatePanel from "../components/ui/StatePanel";

const EMPTY = {
  customerName: "",
  companyName: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  gstNumber: "",
  contactPerson: "",
  email: "",
  phone: "",
};

const FIELDS = [
  ["customerName", "Customer name"],
  ["companyName", "Company name"],
  ["contactPerson", "Contact person"],
  ["phone", "Phone"],
  ["email", "Email", "email"],
  ["gstNumber", "GST number"],
  ["address", "Address", "text", true],
  ["city", "City"],
  ["state", "State"],
  ["country", "Country"],
];

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load(term = search) {
    try {
      setRows(await customerApi.list(term));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) await customerApi.update(editingId, form);
      else await customerApi.create(form);
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  if (!loaded && !error) return <StatePanel>Loading customers…</StatePanel>;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-kicker">Directory</p>
          <h1>Customers</h1>
          <p>Keep client details here. Choosing a customer on a quotation fills the cover automatically.</p>
        </div>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="master-layout">
        <form className="panel panel-flush customer-form" onSubmit={save}>
          <div className="panel-head">
            <div>
              <h2>{editingId ? "Edit customer" : "New customer"}</h2>
              <p>{editingId ? "Update this record in the directory." : "Add a company you quote regularly."}</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              {FIELDS.map(([key, label, type = "text", wide]) => (
                <div className={`field ${wide ? "span-2" : ""}`} key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type={type}
                    value={form[key] || ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="row-actions">
              <button className="btn btn-primary" type="submit">
                {editingId ? "Update customer" : "Save customer"}
              </button>
              {editingId ? (
                <button className="btn btn-ghost" type="button" onClick={reset}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
        <div className="panel panel-flush">
          <form
            className="panel-toolbar filters"
            onSubmit={(event) => {
              event.preventDefault();
              load(search);
            }}
          >
            <label className="filter-field search">
              <span>Search</span>
              <input
                placeholder="Company, contact or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Search
            </button>
          </form>
          {rows.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Phone</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.companyName}</strong>
                      </td>
                      <td>{row.contactPerson || row.customerName}</td>
                      <td>{[row.city, row.state].filter(Boolean).join(", ")}</td>
                      <td>{row.phone}</td>
                      <td className="col-actions">
                        <div className="row-actions end">
                          <button
                            className="btn btn-ghost btn-sm"
                            type="button"
                            onClick={() => {
                              setEditingId(row.id);
                              setForm(row);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            type="button"
                            onClick={async () => {
                              if (!window.confirm("Delete customer?")) return;
                              await customerApi.remove(row.id);
                              if (editingId === row.id) reset();
                              load();
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <strong>{search ? "No customers match" : "No customers yet"}</strong>
              <p>
                {search
                  ? "Try another name, city or contact."
                  : "Save a customer on the left to reuse their details on quotations."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
