import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateQuotation, validateQuotation, resolveGstPercentage } from "../utils/calculations";
import { isoDate } from "../utils/dateFormat";
import {
  emptyQuotation,
  snapshotFromSettings,
  termsWithDefaults,
} from "../data/staticContent";
import { customerApi, quotationApi, settingsApi } from "../services/quotationApi";
import { downloadQuotationPdf } from "../utils/pdfDownload";
import QuotationForm from "../components/quotation/QuotationForm";
import QuotationPreview from "../components/quotation/QuotationPreview";
import QuotationPageNav from "../components/quotation/QuotationPageNav";
import CompletePreviewEditor from "../components/quotation/CompletePreviewEditor";

function payloadFromForm(form, status) {
  return {
    quotationNumber: form.quotationNumber,
    quotationDate: form.quotationDate,
    projectName: form.projectName,
    projectLocation: form.projectLocation,
    clientName: form.clientName,
    clientCompany: form.clientCompany,
    customerId: form.customerId || null,
    items: form.items,
    freight: form.freight,
    installationCharge: form.installationCharge,
    gstPercentage: resolveGstPercentage(form.gstPercentage),
    gstAsExtra: form.gstAsExtra !== false,
    terms: termsWithDefaults(form.terms),
    status,
    companySnapshot: form.companySnapshot,
  };
}


function formFromQuotation(quotation, settings, { asNew = false } = {}) {
  const snapshot = asNew
    ? snapshotFromSettings(settings)
    : quotation.companySnapshot || snapshotFromSettings(settings);
  return {
    ...(asNew ? {} : { id: quotation.id }),
    quotationNumber: asNew ? "" : quotation.quotationNumber || "",
    quotationDate: isoDate(quotation.quotationDate),
    projectName: quotation.projectName || "",
    projectLocation: quotation.projectLocation || "",
    clientName: quotation.clientName || "",
    clientCompany: quotation.clientCompany || "",
    customerId: quotation.customerId || "",
    items: (quotation.items || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      description: item.description || "",
      unitPrice: item.unitPrice ?? "",
      quantity: item.quantity ?? "",
    })),
    freight: quotation.freight ?? "",
    installationCharge: quotation.installationCharge ?? "",
    gstPercentage: quotation.gstPercentage ?? settings?.defaultGst ?? 18,
    gstAsExtra: quotation.gstAsExtra !== false,
    terms: termsWithDefaults(quotation.terms, settings),
    companySnapshot: snapshot,
    status: asNew ? "draft" : quotation.status,
  };
}

export function QuotationWorkspace({ existingId = null, duplicateFromId = null }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scale, setScale] = useState(0.68);
  const [page4Overflow, setPage4Overflow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCompletePreview, setShowCompletePreview] = useState(false);
  const [pdfState, setPdfState] = useState({ phase: "idle", seconds: 0 });
  const isEdit = Boolean(existingId);

  useEffect(() => {
    async function boot() {
      const [settings, customerList] = await Promise.all([settingsApi.get(), customerApi.list()]);
      setCustomers(customerList);
      setCompanySettings(settings);
      const snapshot = snapshotFromSettings(settings);

      if (existingId) {
        const quotation = await quotationApi.get(existingId);
        setForm(formFromQuotation(quotation, settings, { asNew: false }));
        return;
      }

      if (duplicateFromId) {
        const quotation = await quotationApi.get(duplicateFromId);
        setForm(formFromQuotation(quotation, settings, { asNew: true }));
        return;
      }

      setForm(emptyQuotation(snapshot, settings));
    }
    boot().catch((err) => setError(err.message));
  }, [existingId, duplicateFromId]);

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

  const totals = useMemo(
    () =>
      form
        ? calculateQuotation(
            form.items,
            form.freight,
            form.installationCharge,
            form.gstPercentage,
            form.gstAsExtra
          )
        : null,
    [form]
  );

  async function save(status = "draft") {
    const forGenerate = status === "generated";
    const errors = validateQuotation(form, { forGenerate });
    if (errors.length) {
      setError(errors.join(" "));
      return null;
    }
    setSaving(true);
    setError("");
    try {
      const payload = payloadFromForm(form, status);
      const saved = form.id
        ? await quotationApi.update(form.id, payload)
        : await quotationApi.create(payload);
      setForm((current) => ({ ...current, id: saved.id, status: saved.status }));
      setMessage(status === "draft" ? "Draft saved." : "Quotation saved.");
      return saved;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function generate() {
    const saved = await save("generated");
    if (!saved) return;
    setSaving(true);
    try {
      await quotationApi.generatePdf(saved.id, payloadFromForm(form, "generated"));
      setMessage("PDF generated. You can download or print it now.");
      navigate(`/quotations/${saved.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function download() {
    if (pdfState.phase === "generating" || pdfState.phase === "cooldown") return;
    const saved = form.id ? form : await save("draft");
    if (!saved?.id && !form.id) return;
    const id = saved.id || form.id;
    setSaving(true);
    setError("");
    try {
      await downloadQuotationPdf(id, `${form.quotationNumber}.pdf`, setPdfState);
      setMessage("Download started.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function printQuote() {
    if (form.id) {
      window.open(`/quotations/${form.id}/print`, "_blank");
    } else {
      setError("Save the quotation first, then print.");
    }
  }

  function resetForm() {
    if (!window.confirm("Start a new quotation? All unsaved data will be cleared.")) return;
    setForm(emptyQuotation(form.companySnapshot, companySettings));
    setCurrentPage(1);
    setShowCompletePreview(false);
    setError("");
    setMessage("New quotation started.");
  }

  function goToPage(page) {
    setShowCompletePreview(false);
    setCurrentPage(page);
  }

  if (!form || !totals) return <div className="panel">{error || "Loading quotation workspace…"}</div>;

  const previewAll = showCompletePreview;
  const canGoPrev = previewAll || currentPage > 1;
  const canGoNext = !previewAll && currentPage < 5;

  return (
    <>
      <QuotationPageNav
        currentPage={previewAll ? "preview" : currentPage}
        form={form}
        onSelect={goToPage}
      />
      <div className="workspace">
        {previewAll ? (
          <div className="form-pane">
            {error ? <div className="alert">{error}</div> : null}
            {message ? <div className="success">{message}</div> : null}
            <CompletePreviewEditor form={form} onJump={goToPage} />
          </div>
        ) : (
          <QuotationForm
            form={form}
            setForm={setForm}
            customers={customers}
            totals={totals}
            currentPage={currentPage}
            page4Overflow={page4Overflow}
            error={error}
            message={message}
          />
        )}
        <aside className="preview-pane">
          <div className="preview-toolbar">
            <span>{previewAll ? "Complete A4 Quotation" : `Live A4 Preview · Page ${currentPage}`}</span>
            <div>
              <button className="btn btn-ghost" type="button" onClick={() => setScale((s) => Math.max(0.35, s - 0.05))}>
                -
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setScale((s) => Math.min(1, s + 0.05))}>
                +
              </button>
            </div>
          </div>
          <div className="preview-container">
            <QuotationPreview
              quotation={form}
              mode="preview"
              scale={scale}
              visiblePage={previewAll ? "all" : currentPage}
              onPage4Overflow={setPage4Overflow}
            />
          </div>
        </aside>
      </div>
      <div className="page-step-bar">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!canGoPrev}
          onClick={() => (previewAll ? goToPage(5) : goToPage(currentPage - 1))}
        >
          ← Previous Page
        </button>
        <div className="page-step-actions">
          {!isEdit ? (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Reset Form
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={() => save("draft")} disabled={saving}>
            Save Draft
          </button>
          <button type="button" className="btn btn-dark" onClick={() => setShowCompletePreview(true)}>
            Preview Quotation
          </button>
          <button type="button" className="btn btn-primary" onClick={generate} disabled={saving || pdfState.phase === "generating"}>
            Generate PDF
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={download}
            disabled={saving || pdfState.phase !== "idle"}
          >
            {pdfState.phase === "generating"
              ? "Generating PDF..."
              : pdfState.phase === "cooldown"
                ? `Try Again in ${pdfState.seconds}s`
                : "Download"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={printQuote}>
            Print
          </button>
        </div>
        {canGoNext ? (
          <button type="button" className="btn btn-primary" onClick={() => goToPage(currentPage + 1)}>
            Next Page →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setShowCompletePreview(true)}>
            Preview Quotation →
          </button>
        )}
      </div>
    </>
  );
}

export default function CreateQuotation() {
  return (
    <div className="workspace-shell">
      <div className="page-head">
        <div>
          <h1>Create Quotation</h1>
          <p>Work through the quotation page by page. The live A4 sheet updates as you type.</p>
        </div>
      </div>
      <QuotationWorkspace />
    </div>
  );
}
