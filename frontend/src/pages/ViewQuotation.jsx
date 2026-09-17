import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatINR } from "../utils/currency";
import { formatShortDate } from "../utils/dateFormat";
import { quotationApi } from "../services/quotationApi";
import QuotationPreview from "../components/quotation/QuotationPreview";

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    quotationApi.get(id).then(setQuotation).catch((err) => setError(err.message));
  }, [id]);

  async function download() {
    try {
      const blob = await quotationApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotation.quotationNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

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
          <button className="btn btn-primary" type="button" onClick={download}>
            Download PDF
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
