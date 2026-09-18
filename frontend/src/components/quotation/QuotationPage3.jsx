import { DEFAULT_COMPANY, GUARANTEE_TEXT } from "../../data/staticContent";
import { PageFooter, QuotationLogo, QuotationWatermark } from "./Brand";

export default function QuotationPage3({ company = DEFAULT_COMPANY }) {
  const logo = company.logoPath || "/assets/careyu-logo.png";
  return (
    <section className="q-page-3">
      <QuotationLogo logo={logo} />
      <QuotationWatermark logo={logo} />
      <div className="q-frame">
        <div className="p3-inner">
          <h2 className="p3-title">GUARANTEE</h2>
          <p className="p3-copy">{GUARANTEE_TEXT[0]}</p>
          <p className="p3-copy">{GUARANTEE_TEXT[1]}</p>
          <PageFooter company={company} />
        </div>
      </div>
    </section>
  );
}
