export function BrandMark({ logo = "/assets/careyu-logo.png", size = "header" }) {
  return (
    <div className={`q-brand ${size === "cover" ? "p1-brand" : ""}`}>
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

export function CoverBrand({ logo = "/assets/careyu-logo.png" }) {
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

export function PageHeader({ company }) {
  return (
    <div className="q-header">
      <BrandMark logo={company?.logoPath || "/assets/careyu-logo.png"} />
    </div>
  );
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
