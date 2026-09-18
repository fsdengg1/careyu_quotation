import { GENERAL_TERM_ROWS } from "../../data/staticContent";
import TermsEditor from "./TermsEditor";

export default function Page5Editor({ form, onChange }) {
  return (
    <div className="page-editor">
      <header className="page-editor-head">
        <p>PAGE 5</p>
        <h2>Terms & Conditions</h2>
      </header>
      <div className="page-editor-fields">
        <p className="terms-edit-hint">
          Edit the four commercial terms below. General terms always use the Care Yu default.
        </p>
        <TermsEditor terms={form.terms} onChange={(terms) => onChange({ terms })} />
        <div className="field">
          <label>AMC Note</label>
          <textarea
            placeholder="Enter AMC note"
            value={form.terms?.amcNote || ""}
            onChange={(e) => onChange({ terms: { ...form.terms, amcNote: e.target.value } })}
          />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Signature Name</label>
            <input
              type="text"
              placeholder="Signature name"
              value={form.companySnapshot?.signatureName || ""}
              onChange={(e) =>
                onChange({
                  companySnapshot: {
                    ...(form.companySnapshot || {}),
                    signatureName: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="field">
            <label>Designation</label>
            <input
              type="text"
              placeholder="Designation"
              value={form.companySnapshot?.signatureDesignation || ""}
              onChange={(e) =>
                onChange({
                  companySnapshot: {
                    ...(form.companySnapshot || {}),
                    signatureDesignation: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
        <div className="terms-default-block">
          <div className="terms-default-head">
            <span>5</span>
            <strong>General</strong>
            <em>Default</em>
          </div>
          <ul>
            {GENERAL_TERM_ROWS.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
