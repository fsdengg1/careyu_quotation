import { useEffect, useState } from "react";
import { customerApi } from "../services/quotationApi";

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

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load(term = search) {
    setRows(await customerApi.list(term));
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

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <p>Maintain a customer master. Selecting a customer on a quotation fills client details automatically.</p>
        </div>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="workspace">
        <form className="panel" onSubmit={save}>
          <h3 style={{ marginTop: 0 }}>{editingId ? "Edit customer" : "New customer"}</h3>
          {[
            ["customerName", "Customer Name"],
            ["companyName", "Company Name"],
            ["contactPerson", "Contact Person"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["gstNumber", "GST Number"],
            ["address", "Address"],
            ["city", "City"],
            ["state", "State"],
            ["country", "Country"],
          ].map(([key, label]) => (
            <div className="field" key={key} style={{ marginBottom: 10 }}>
              <label>{label}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="row-actions">
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update" : "Save customer"}
            </button>
            {editingId ? (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        <div className="panel">
          <div className="filters">
            <input
              placeholder="Search customers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-dark" type="button" onClick={() => load(search)}>
              Search
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.companyName}</td>
                  <td>{row.contactPerson || row.customerName}</td>
                  <td>{[row.city, row.state].filter(Boolean).join(", ")}</td>
                  <td>{row.phone}</td>
                  <td className="row-actions">
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditingId(row.id);
                        setForm(row);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Delete customer?")) return;
                        await customerApi.remove(row.id);
                        load();
                      }}
                    >
                      Delete
                    </button>
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
