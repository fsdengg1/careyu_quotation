import { QUOTATION_PAGES, getPageStatus, statusLabel } from "../../utils/pageStatus";

export default function QuotationPageNav({ currentPage, form, onSelect }) {
  return (
    <nav className="page-nav" aria-label="Quotation pages">
      {QUOTATION_PAGES.map((page) => {
        const status = getPageStatus(page.id, form);
        const active = currentPage === page.id;
        return (
          <button
            key={page.id}
            type="button"
            className={`page-nav-btn ${active ? "active" : ""}`}
            onClick={() => onSelect(page.id)}
          >
            <span className="page-nav-label">{page.label}</span>
            <span className={`page-nav-status ${status}`}>
              {status === "static" || status === "completed" ? "✓" : "○"} {statusLabel(status)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
