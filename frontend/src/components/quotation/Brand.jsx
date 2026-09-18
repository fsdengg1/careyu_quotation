const DEFAULT_LOGO = "/assets/careyu-logo.png";

export function BrandMark({ logo = DEFAULT_LOGO }) {
  return (
    <div className="q-brand">
      <img src={logo} alt="Care Yu Automation" />
      <div className="q-wordmark">
        <div className="wm-name">
          CARE <span>YU</span>
        </div>
        <div className="wm-sub">AUTOMATION</div>
      </div>
    </div>
  );
}

const AUTOMATION_LETTERS = "AUTOMATION".split("");

export function CoverBrand({ logo = DEFAULT_LOGO }) {
  return (
    <div className="p1-logo-row">
      <img src={logo} alt="Care Yu Automation" />
      <div className="p1-wordmark">
        <div className="wm-name">
          CARE <span>YU</span>
        </div>
        <div className="wm-sub" aria-label="AUTOMATION">
          {AUTOMATION_LETTERS.map((letter, index) => (
            <span key={`${letter}-${index}`}>{letter}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuotationLogo({ logo = DEFAULT_LOGO }) {
  return (
    <div className="quotation-logo">
      <BrandMark logo={logo} />
    </div>
  );
}

export function QuotationWatermark({ logo = DEFAULT_LOGO }) {
  return (
    <div className="quotation-watermark" aria-hidden="true">
      <img src={logo} alt="" />
      <div className="q-wordmark">
        <div className="wm-name">
          CARE <span>YU</span>
        </div>
        <div className="wm-sub">AUTOMATION</div>
      </div>
    </div>
  );
}

export function PageHeader({ company }) {
  return <QuotationLogo logo={company?.logoPath || DEFAULT_LOGO} />;
}

export function PageFooter({ company }) {
  return (
    <div className="q-footer">
      <div className="q-web">{company?.website || "www.careyuautomation.com"}</div>
      <div className="q-tags">
        {company?.footerTagline || "Racking | Stacking | Automation | Structures | Consulting"}
      </div>
    </div>
  );
}
