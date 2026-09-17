import { DEFAULT_COMPANY } from "../../data/staticContent";
import { formatINR } from "../../utils/currency";
import { PageFooter, PageHeader } from "./Brand";

export default function QuotationPage4({ quotation, totals, company = DEFAULT_COMPANY, contentRef }) {
  const gstPct = Number(totals.gstPercentage);

  return (
    <section className="q-page-4" ref={contentRef}>
      <div className="q-frame">
        <div className="p4-inner">
          <PageHeader company={company} />
          <div className="p4-intro">
            <strong>Dear Sir,</strong>
            <br />
            We thank for your kind enquiry and we have pleasure to offer our rate for{" "}
            <strong>{quotation.projectName || "the following items"}</strong> as detailed
            below.
          </div>
          <table className="p4-table">
            <thead>
              <tr>
                <th className="p4-col-sl">SL.No</th>
                <th>Material Descriptions</th>
                <th className="p4-col-unit">Unit Price</th>
                <th className="p4-col-qty">QTY.</th>
                <th className="p4-col-total">
                  Total amount
                  <br />
                  in Rs.
                </th>
              </tr>
            </thead>
            <tbody>
              {(totals.items || []).map((item) => (
                <tr key={item.id || item.serialNumber}>
                  <td className="p4-col-sl">{item.serialNumber}</td>
                  <td className="p4-desc">
                    {String(item.description || "").split("\n").map((line, index) => (
                      <div key={`${line}-${index}`}>{line}</div>
                    ))}
                  </td>
                  <td className="p4-col-unit">{formatINR(item.unitPrice)}</td>
                  <td className="p4-col-qty">{item.quantity}</td>
                  <td className="p4-col-total">{formatINR(item.totalAmount)}</td>
                </tr>
              ))}
              <tr className="p4-sum">
                <td colSpan={4} className="p4-sum-label">
                  Basic Landed
                </td>
                <td className="p4-sum-value">{formatINR(totals.subtotal)}</td>
              </tr>
              <tr className="p4-sum">
                <td colSpan={4} className="p4-sum-label">
                  Freight
                </td>
                <td className="p4-sum-value">{formatINR(totals.freight)}</td>
              </tr>
              <tr className="p4-sum">
                <td colSpan={4} className="p4-sum-label">
                  Installation & Integration
                </td>
                <td className="p4-sum-value">{formatINR(totals.installationCharge)}</td>
              </tr>
              <tr className="p4-sum">
                <td colSpan={4} className="p4-sum-label">
                  Total Basic Landed
                </td>
                <td className="p4-sum-value">{formatINR(totals.totalBasicLanded)}</td>
              </tr>
              <tr className="p4-sum">
                <td colSpan={4} className="p4-sum-label">
                  GST @ {gstPct}%
                </td>
                <td className="p4-sum-value">
                  {totals.gstAsExtra === false ? formatINR(totals.gstAmount) : "EXTRA"}
                </td>
              </tr>
              {totals.gstAsExtra === false ? (
                <tr className="p4-sum">
                  <td colSpan={4} className="p4-sum-label">
                    Grand Total
                  </td>
                  <td className="p4-sum-value">{formatINR(totals.grandTotal)}</td>
                </tr>
              ) : null}
              <tr className="p4-yellow">
                <td colSpan={5}>{totals.amountInWords}</td>
              </tr>
              <tr className="p4-yellow">
                <td colSpan={5}>NOTE: “{quotation.terms?.amcNote || ""}”</td>
              </tr>
            </tbody>
          </table>
          <div className="p4-watermark-word">AUTOMATION</div>
          <PageFooter company={company} />
        </div>
      </div>
    </section>
  );
}
