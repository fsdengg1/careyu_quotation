import { ABOUT_US, DEFAULT_COMPANY } from "../../data/staticContent";
import { BrandMark, PageFooter } from "./Brand";

export default function QuotationPage2({ company = DEFAULT_COMPANY }) {
  return (
    <section className="q-page-2">
      <div className="p2-layout">
        <div className="p2-main">
          <h2 className="p2-title">About us</h2>
          <div className="p2-copy">
            {ABOUT_US.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="p2-right">
          <div className="p2-logo-wrap">
            <BrandMark logo={company.logoPath || "/assets/careyu-logo.png"} />
          </div>
          <aside className="p2-panel">
          <div className="p2-rule" />
          <div className="p2-square" />
          <div className="p2-panel-body">
            <div className="p2-seamless">
              SEAMLESS
              <br />
              INTEGRATION
            </div>
            <div className="p2-spear">
              SOLUTIONS THAT
              <br />
              SPEARHEAD GROWTH
            </div>
            <div className="p2-stat">
              <div className="num">50+</div>
              <div className="lbl">
                PROJECTS
                <br />
                EXECUTED
              </div>
            </div>
            <div className="p2-stat">
              <div className="num">45+</div>
              <div className="lbl">HAPPY CUSTOMERS</div>
            </div>
            <div className="p2-stat">
              <div className="num">3+</div>
              <div className="lbl">COUNTRIES SERVED</div>
            </div>
          </div>
        </aside>
        </div>
      </div>
      <PageFooter company={company} />
    </section>
  );
}
