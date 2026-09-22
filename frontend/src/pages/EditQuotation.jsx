import { Link, useParams } from "react-router-dom";
import { QuotationWorkspace } from "./CreateQuotation";

export default function EditQuotation() {
  const { id } = useParams();
  return (
    <div className="workspace-shell">
      <div className="page-head">
        <div>
          <p className="page-kicker">
            <Link to="/quotations">Quotations</Link>
          </p>
          <h1>Edit quotation</h1>
        </div>
      </div>
      <QuotationWorkspace existingId={id} />
    </div>
  );
}
