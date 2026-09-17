import { formatINR } from "../../utils/currency";

export default function QuotationTotals({ totals }) {
  const extra = totals.gstAsExtra !== false;
  const gstLabel = `GST @ ${totals.gstPercentage}%`;

  return (
    <div className="totals-box">
      <div>
        <span>Basic Landed</span>
        <strong>{formatINR(totals.subtotal)}</strong>
      </div>
      <div>
        <span>Freight</span>
        <strong>{formatINR(totals.freight)}</strong>
      </div>
      <div>
        <span>Installation & Integration</span>
        <strong>{formatINR(totals.installationCharge)}</strong>
      </div>
      <div>
        <span>Total Basic Landed</span>
        <strong>{formatINR(totals.totalBasicLanded)}</strong>
      </div>
      <div>
        <span>{gstLabel}</span>
        <strong>{extra ? "EXTRA" : formatINR(totals.gstAmount)}</strong>
      </div>
      {extra ? null : (
        <div className="grand">
          <span>Grand Total (incl. GST)</span>
          <strong>{formatINR(totals.grandTotal)}</strong>
        </div>
      )}
      <div className="words">{totals.amountInWords}</div>
    </div>
  );
}
