import { QUOTATION_PAGES, getPageStatus, statusLabel } from "../../utils/pageStatus";

export default function CompletePreviewEditor({ form, onJump }) {
  return (
    <div className="page-editor">
      <header className="page-editor-head">
        <p>COMPLETE QUOTATION</p>
        <h2>Preview all 5 pages</h2>
      </header>
      <p className="static-page-note" style={{ marginBottom: 16 }}>
        Review every A4 sheet on the right. If a page needs changes, open it from the list below.
      </p>
      <div className="preview-jump-list">
        {QUOTATION_PAGES.map((page) => {
          const status = getPageStatus(page.id, form);
          return (
            <button key={page.id} type="button" className="preview-jump" onClick={() => onJump(page.id)}>
              <span>
                PAGE {page.id} · {page.title}
              </span>
              <span className={`page-nav-status ${status}`}>
                {status === "static" || status === "completed" ? "✓" : "•"} {statusLabel(status)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
