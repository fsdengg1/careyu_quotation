import { useParams } from "react-router-dom";
import { QuotationWorkspace } from "./CreateQuotation";

export default function DuplicateQuotation() {
  const { id } = useParams();
  return (
    <div className="workspace-shell">
      <div className="page-head">
        <div>
          <h1>Duplicate Quotation</h1>
          <p>
            This is a new quotation started from an existing one. Review the copied pages, then save
            it as a new record.
          </p>
        </div>
      </div>
      <QuotationWorkspace duplicateFromId={id} />
    </div>
  );
}
