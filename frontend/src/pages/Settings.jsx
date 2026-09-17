import { useEffect, useState } from "react";
import { settingsApi } from "../services/quotationApi";

export default function Settings() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    settingsApi.get().then(setForm).catch((err) => setError(err.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      const saved = await settingsApi.update(form);
      setForm(saved);
      setMessage("Settings saved. New quotations will use these values. Existing quotations stay unchanged.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!form) return <div className="panel">{error || "Loading settings…"}</div>;

  const fields = [
    ["companyName", "Company Name"],
    ["address", "Address", "textarea"],
    ["website", "Website"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["defaultGst", "Default GST %"],
    ["defaultQuotationValidity", "Default quotation validity", "textarea"],
    ["defaultPaymentTerms", "Default payment terms", "textarea"],
    ["defaultWarranty", "Default warranty", "textarea"],
    ["defaultSoftwareDevelopment", "Default software development", "textarea"],
    ["defaultAmcNote", "Default AMC note", "textarea"],
    ["signatureName", "Signature name"],
    ["signatureDesignation", "Signature designation"],
    ["footerTagline", "Footer tagline"],
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Company Settings</h1>
          <p>Letterhead, signature and default commercial terms for future quotations.</p>
        </div>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      {message ? <div className="success">{message}</div> : null}
      <form className="panel" onSubmit={save} style={{ maxWidth: 760 }}>
        {fields.map(([key, label, type]) => (
          <div className="field" key={key} style={{ marginBottom: 12 }}>
            <label>{label}</label>
            {type === "textarea" ? (
              <textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            ) : (
              <input value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            )}
          </div>
        ))}
        <button className="btn btn-primary" type="submit">
          Save settings
        </button>
      </form>
    </>
  );
}
