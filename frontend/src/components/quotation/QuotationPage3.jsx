import { DEFAULT_COMPANY, GUARANTEE_TEXT } from "../../data/staticContent";
import { PageFooter, PageHeader } from "./Brand";

export default function QuotationPage3({ company = DEFAULT_COMPANY }) {
  return (
    <section className="q-page-3">
      <div className="q-frame">
        <div className="p3-inner">
          <PageHeader company={company} />
          <h2 className="p3-title">GUARANTEE</h2>
          <p className="p3-copy">{GUARANTEE_TEXT[0]}</p>
          <p className="p3-copy">{GUARANTEE_TEXT[1]}</p>
          <div className="p3-watermark">
            <img src={company.logoPath || "/assets/careyu-logo.png"} alt="" />
            <div className="q-wordmark">
              <div className="wm-name">
                CARE <span>YU</span>
              </div>
              <div className="wm-sub">AUTOMATION</div>
            </div>
          </div>
          <PageFooter company={company} />
        </div>
      </div>
    </section>
  );
}
