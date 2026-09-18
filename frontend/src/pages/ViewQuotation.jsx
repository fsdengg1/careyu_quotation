import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatINR } from "../utils/currency";
import { formatShortDate } from "../utils/dateFormat";
import { quotationApi } from "../services/quotationApi";
import { downloadQuotationPdf } from "../utils/pdfDownload";
import QuotationPreview from "../components/quotation/QuotationPreview";

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState("");
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
      ? "Generating PDF..."
      : pdfState.phase === "cooldown"
        ? `Try Again in ${pdfState.seconds}s`
        : "Download PDF";

  if (!quotation) return <div className="panel">{error || "Loading…"}</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{quotation.quotationNumber}</h1>
          <p>
            {quotation.clientCompany} · {formatShortDate(quotation.quotationDate)} · {formatINR(quotation.grandTotal)}
          </p>
        </div>
        <div className="row-actions">
          <Link className="btn btn-ghost" to={`/quotations/${id}/edit`}>
            Edit
          </Link>
          <button className="btn btn-primary" type="button" onClick={download} disabled={pdfBusy}>
            {pdfLabel}
          </button>
          <Link className="btn btn-dark" to={`/quotations/${id}/print`} target="_blank">
            Print
          </Link>
          <button className="btn btn-ghost" type="button" onClick={() => navigate("/quotations")}>
            Back
          </button>
        </div>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="preview-pane" style={{ minHeight: "80vh" }}>
        <div className="preview-container">
          <QuotationPreview quotation={quotation} mode="preview" scale={0.72} />
        </div>
      </div>
    </>
  );
}
