import { useParams } from "react-router-dom";
import { QuotationWorkspace } from "./CreateQuotation";

export default function EditQuotation() {
  const { id } = useParams();
  return (
    <div className="workspace-shell">
      <div className="page-head">
        <div>
          <h1>Edit Quotation</h1>
          <p>Edit this quotation page by page. Company letterhead stays frozen to this quotation.</p>
        </div>
      </div>
      <QuotationWorkspace existingId={id} />
    </div>
  );
}
