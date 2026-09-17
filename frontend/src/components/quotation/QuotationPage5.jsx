import { DEFAULT_COMPANY, DEFAULT_GENERAL_TERMS } from "../../data/staticContent";
import { PageFooter, PageHeader } from "./Brand";

function nl(value) {
  return String(value || "")
    .split("\n")
    .map((line, index) => <div key={`${line}-${index}`}>{line}</div>);
}

export default function QuotationPage5({ quotation, company = DEFAULT_COMPANY }) {
  const t = { ...DEFAULT_GENERAL_TERMS, ...(quotation.terms || {}) };
  const rows = [
    ["1", "Software Development & Implementation", t.softwareDevelopment, false],
    ["2", "Quotation Validity", t.quotationValidity, false],
    ["3", "Terms of payment", t.paymentTerms, true],
    ["4", "Warranty", t.warranty, true],
    ["5", "General", t.generalTerms || DEFAULT_GENERAL_TERMS.generalTerms, false],
    ["", "", t.jurisdiction || DEFAULT_GENERAL_TERMS.jurisdiction, false],
    ["", "", t.liability || DEFAULT_GENERAL_TERMS.liability, false],
    ["", "", t.salesTerms || DEFAULT_GENERAL_TERMS.salesTerms, false],
    ["", "", t.insurance || DEFAULT_GENERAL_TERMS.insurance, false],
    ["", "", t.arbitration || DEFAULT_GENERAL_TERMS.arbitration, false],
  ];

  return (
    <section className="q-page-5">
      <div className="q-frame">
        <div className="p5-inner">
          <PageHeader company={company} />
          <h2 className="p5-title">TERMS AND CONDITIONS</h2>
          <table className="p5-table">
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row[0]}-${index}`}>
                  <td className="p5-no">{row[0]}</td>
                  <td className="p5-key">{nl(row[1])}</td>
                  <td className={`p5-val ${row[3] ? "emphasis" : ""}`}>{nl(row[2])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p5-close">
            We hope that our offer will be in line with your requirements and looking for your
            valuable order.
            <br />
            Thanking You,
          </div>
          <div className="p5-sign">
            Regards
            <br />
            <span className="who">{company.signatureName || "Shradha"}</span>
            <br />
            {company.signatureDesignation || "Business Head"}
            <br />
            {company.companyName || "Care YU Automation PVT. LTD"}
          </div>
          <PageFooter company={company} />
        </div>
      </div>
    </section>
  );
}
