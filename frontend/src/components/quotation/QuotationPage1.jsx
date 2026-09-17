import { formatCoverDate } from "../../utils/dateFormat";
import { DEFAULT_COMPANY } from "../../data/staticContent";
import { CoverBrand } from "./Brand";

export default function QuotationPage1({ quotation, company = DEFAULT_COMPANY }) {
  const project = String(quotation.projectName || "").trim().toUpperCase();
  const address = (company.address || "").split("\n");

  return (
    <div className="q-page-1">
      <div className="p1-strip" />
      <div className="p1-hero">
        <img src="/assets/cover-bg.jpg" alt="" />
        <div className="p1-hero-wash" />
      </div>
      <div className="p1-cloud">
        <svg viewBox="0 0 210 50" preserveAspectRatio="none" aria-hidden="true">
          <path
            fill="#bcd0e9"
            d="M0,50 L0,27 C20,21 42,25 64,22 C92,18 112,5 142,0 C166,-4 188,5 210,18 L210,50 Z"
          />
        </svg>
        <div className="p1-cloud-body" />
      </div>
      <CoverBrand logo={company.logoPath || "/assets/careyu-logo.png"} />
      <div className="p1-content">
        <h1 className="p1-title">QUOTATION</h1>
        <h2 className="p1-project">{project}</h2>
        <div className="p1-grid">
          <div>
            <div className="p1-label">QUOTATION NO:</div>
            <div className="p1-value">{quotation.quotationNumber ? String(quotation.quotationNumber).toUpperCase() : "—"}</div>
          </div>
          <div className="right">
            <div className="p1-label">PROJECT LOCATION:</div>
            <div className="p1-value">{quotation.projectLocation ? String(quotation.projectLocation).toUpperCase() : "—"}</div>
          </div>
        </div>
        <div className="p1-dated">
          <div className="p1-label">DATED:</div>
          <div className="p1-value">{quotation.quotationDate ? formatCoverDate(quotation.quotationDate) : "—"}</div>
        </div>
        <div className="p1-client">
          <div className="p1-label">CLIENT NAME:</div>
          <div className="p1-value">
            {quotation.clientCompany || quotation.clientName
              ? String(quotation.clientCompany || quotation.clientName).toUpperCase()
              : "—"}
          </div>
        </div>
      </div>
      <div className="p1-bottom">
        <div>
          <div className="p1-company-name">
            CARE <span>YU</span> AUTOMATION PVT LTD.
          </div>
          <div className="p1-address">
            {address.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
        <div className="p1-contacts">
          <div className="web">{company.website}</div>
          <div className="mail">{company.email}</div>
          <div>{company.phone}</div>
        </div>
      </div>
    </div>
  );
}
