import { useEffect } from "react";
import { calculateQuotation, DEFAULT_GST_PERCENTAGE, resolveGstPercentage } from "../../utils/calculations";
import QuotationItemEditor from "./QuotationItemEditor";
import QuotationTotals from "./QuotationTotals";

export default function Page4Editor({ form, totals, page4Overflow, onChange }) {
  useEffect(() => {
    if (form.gstPercentage === "" || form.gstPercentage == null) {
      onChange({ gstPercentage: DEFAULT_GST_PERCENTAGE });
    }
  }, [form.gstPercentage]);

  const computed =
    totals ||
    calculateQuotation(
      form.items,
      form.freight,
      form.installationCharge,
      form.gstPercentage,
      form.gstAsExtra
    );

  return (
    <div className="page-editor">
      <header className="page-editor-head">
        <p>PAGE 4</p>
        <h2>Quotation Details</h2>
      </header>
      <QuotationItemEditor
        items={form.items}
        onChange={(items) => onChange({ items })}
        page4Overflow={page4Overflow}
      />
      <div className="page-editor-fields" style={{ paddingTop: 4 }}>
        <div className="grid-2">
          <div className="field">
            <label>Freight</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter freight amount"
              value={form.freight}
              onChange={(e) => onChange({ freight: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Installation & Integration</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter installation amount"
              value={form.installationCharge}
              onChange={(e) => onChange({ installationCharge: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>GST handling</label>
          <div className="gst-mode">
            <label>
              <input
                type="radio"
                name="gstMode"
                checked={form.gstAsExtra !== false}
                onChange={() => onChange({ gstAsExtra: true })}
              />
              Extra
            </label>
            <label>
              <input
                type="radio"
                name="gstMode"
                checked={form.gstAsExtra === false}
                onChange={() =>
                  onChange({
                    gstAsExtra: false,
                    gstPercentage: resolveGstPercentage(form.gstPercentage),
                  })
                }
              />
              Include in total
            </label>
          </div>
          <p className="gst-mode-hint">
            {form.gstAsExtra === false
              ? "GST amount is calculated and added to the Grand Total."
              : "GST is shown as Extra. Only Total Basic Landed is used. No Grand Total."}
          </p>
        </div>
        <div className="field">
          <label>GST %</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="18"
            value={form.gstPercentage}
            onChange={(e) => onChange({ gstPercentage: e.target.value })}
          />
        </div>
        <QuotationTotals totals={computed} />
      </div>
    </div>
  );
}
