import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { quotationApi } from "../services/quotationApi";
import QuotationPreview from "../components/quotation/QuotationPreview";

export default function PrintQuotation() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);

  useEffect(() => {
    quotationApi.get(id).then((data) => {
      setQuotation(data);
      setTimeout(() => window.print(), 600);
    });
  }, [id]);

  if (!quotation) return <div className="print-root">Preparing print preview…</div>;

  return (
    <div className="print-root">
      <QuotationPreview quotation={quotation} mode="print" />
    </div>
  );
}
