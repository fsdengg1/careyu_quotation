const EDITABLE_FIELDS = [
  ["softwareDevelopment", "Software Development & Implementation"],
  ["quotationValidity", "Quotation Validity"],
  ["paymentTerms", "Terms of Payment"],
  ["warranty", "Warranty"],
];

export default function TermsEditor({ terms, onChange }) {
  return (
    <>
      {EDITABLE_FIELDS.map(([key, label]) => (
        <div className="field" key={key}>
          <label>{label}</label>
          <textarea
            placeholder={`Enter ${label.toLowerCase()}`}
            value={terms[key] || ""}
            onChange={(e) => onChange({ ...terms, [key]: e.target.value })}
          />
        </div>
      ))}
    </>
  );
}
