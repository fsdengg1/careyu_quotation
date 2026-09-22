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
            className={`page-nav-btn ${active ? "active" : ""} is-${status}`}
            onClick={() => onSelect(page.id)}
          >
            <span className="page-nav-index">{page.id}</span>
            <span className="page-nav-copy">
              <span className="page-nav-label">{page.title}</span>
              <span className={`page-nav-status ${status}`}>{statusLabel(status)}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
