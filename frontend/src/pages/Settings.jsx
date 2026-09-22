import { useEffect, useState } from "react";
import { settingsApi } from "../services/quotationApi";
import StatePanel from "../components/ui/StatePanel";

const SECTIONS = [
  {
    title: "Company profile",
    text: "Letterhead details copied onto new quotations.",
    fields: [
      ["companyName", "Company name"],
      ["website", "Website"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["address", "Address", "textarea"],
    ],
  },
  {
    title: "Commercial defaults",
    text: "Starting values for GST and the terms page. Existing quotations stay unchanged.",
    fields: [
      ["defaultGst", "Default GST %"],
      ["defaultQuotationValidity", "Quotation validity", "textarea"],
      ["defaultPaymentTerms", "Payment terms", "textarea"],
      ["defaultWarranty", "Warranty", "textarea"],
      ["defaultSoftwareDevelopment", "Software development", "textarea"],
      ["defaultAmcNote", "AMC note", "textarea"],
    ],
  },
  {
    title: "Signature and footer",
    text: "Name, designation and the line printed at the foot of the quotation.",
    fields: [
      ["signatureName", "Signature name"],
      ["signatureDesignation", "Signature designation"],
      ["footerTagline", "Footer tagline", "textarea"],
    ],
  },
];

export default function Settings() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    settingsApi.get().then(setForm).catch((err) => setError(err.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setMessage("");
    try {
      const saved = await settingsApi.update(form);
      setForm(saved);
      setMessage("Settings saved. New quotations will use these values. Existing quotations stay unchanged.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!form) return <StatePanel error={error}>Loading settings…</StatePanel>;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-kicker">Company</p>
          <h1>Settings</h1>
          <p>Letterhead, signature and the commercial terms used when a quotation is created.</p>
        </div>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      {message ? <div className="success">{message}</div> : null}
      <form className="settings-layout" onSubmit={save}>
        {SECTIONS.map((section) => (
          <section className="panel panel-flush" key={section.title}>
            <div className="panel-head">
              <div>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="settings-grid">
                {section.fields.map(([key, label, type]) => (
                  <div className={`field ${type === "textarea" ? "span-2" : ""}`} key={key}>
                    <label htmlFor={key}>{label}</label>
                    {type === "textarea" ? (
                      <textarea
                        id={key}
                        value={form[key] || ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    ) : (
                      <input
                        id={key}
                        value={form[key] ?? ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
        <div className="settings-actions">
          <button className="btn btn-primary" type="submit">
            Save settings
          </button>
        </div>
      </form>
    </>
  );
}
