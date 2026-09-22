import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatINR } from "../utils/currency";
import { formatShortDate } from "../utils/dateFormat";
import { quotationApi } from "../services/quotationApi";
import { downloadQuotationPdf } from "../utils/pdfDownload";
import QuotationPreview from "../components/quotation/QuotationPreview";
import StatePanel from "../components/ui/StatePanel";

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(0.72);
  const [pdfState, setPdfState] = useState({ phase: "idle", seconds: 0 });

  useEffect(() => {
    quotationApi.get(id).then(setQuotation).catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (pdfState.phase !== "cooldown" || pdfState.seconds <= 0) return undefined;
    const timer = setTimeout(() => {
      setPdfState((current) => {
        if (current.phase !== "cooldown") return current;
        const seconds = current.seconds - 1;
        return seconds <= 0 ? { phase: "idle", seconds: 0 } : { phase: "cooldown", seconds };
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [pdfState]);

  async function download() {
    if (pdfState.phase === "generating" || pdfState.phase === "cooldown") return;
    setError("");
    try {
      await downloadQuotationPdf(id, `${quotation.quotationNumber}.pdf`, setPdfState);
    } catch (err) {
      setError(err.message);
    }
  }

  const pdfBusy = pdfState.phase === "generating" || pdfState.phase === "cooldown";
  const pdfLabel =
    pdfState.phase === "generating"
      ? "Generating PDF…"
      : pdfState.phase === "cooldown"
        ? `Try again in ${pdfState.seconds}s`
        : "Download PDF";

  if (!quotation) return <StatePanel error={error}>Loading quotation…</StatePanel>;

  return (
    <div className="viewer-shell">
      <div className="page-head">
        <div>
          <p className="page-kicker">
            <Link to="/quotations">Quotations</Link>
          </p>
          <h1>{quotation.quotationNumber}</h1>
        </div>
        <div className="page-head-actions">
          <span className={`badge ${quotation.status}`}>{quotation.status}</span>
          <button className="btn btn-ghost" type="button" onClick={() => navigate("/quotations")}>
            Back
          </button>
          <Link className="btn btn-ghost" to={`/quotations/${id}/edit`}>
            Edit
          </Link>
          <Link className="btn btn-ghost" to={`/quotations/${id}/duplicate`}>
            Duplicate
          </Link>
          <Link className="btn btn-dark" to={`/quotations/${id}/print`} target="_blank">
            Print
          </Link>
          <button className="btn btn-primary" type="button" onClick={download} disabled={pdfBusy}>
            {pdfLabel}
          </button>
        </div>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="fact-row">
        <div>
          <span>Date</span>
          <strong>{formatShortDate(quotation.quotationDate)}</strong>
        </div>
        <div>
          <span>Project</span>
          <strong>{quotation.projectName || "—"}</strong>
        </div>
        <div>
          <span>Client</span>
          <strong>{quotation.clientCompany || "—"}</strong>
        </div>
        <div>
          <span>Amount</span>
          <strong>{formatINR(quotation.grandTotal)}</strong>
        </div>
      </div>
      <div className="preview-pane viewer-pane">
        <div className="preview-toolbar">
          <span>A4 quotation</span>
          <div className="zoom-controls">
            <button className="icon-btn" type="button" aria-label="Zoom out" onClick={() => setScale((s) => Math.max(0.35, +(s - 0.05).toFixed(2)))}>
              −
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button className="icon-btn" type="button" aria-label="Zoom in" onClick={() => setScale((s) => Math.min(1, +(s + 0.05).toFixed(2)))}>
              +
            </button>
          </div>
        </div>
        <div className="preview-container">
          <QuotationPreview quotation={quotation} mode="preview" scale={scale} />
        </div>
      </div>
    </div>
  );
}
