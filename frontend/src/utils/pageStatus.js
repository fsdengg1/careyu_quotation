export const QUOTATION_PAGES = [
  { id: 1, title: "Quotation Cover", label: "Page 1" },
  { id: 2, title: "About Us", label: "Page 2" },
  { id: 3, title: "Guarantee", label: "Page 3" },
  { id: 4, title: "Quotation Details", label: "Page 4" },
  { id: 5, title: "Terms & Conditions", label: "Page 5" },
];

export function getPageStatus(page, form) {
  if (!form) return "incomplete";
  if (page === 2 || page === 3) return "static";

  if (page === 1) {
    const ready =
      String(form.quotationNumber || "").trim() &&
      form.quotationDate &&
      String(form.projectName || "").trim() &&
      String(form.projectLocation || "").trim() &&
      String(form.clientName || "").trim() &&
      String(form.clientCompany || "").trim();
    return ready ? "completed" : "incomplete";
  }

  if (page === 4) {
    const hasItem = (form.items || []).some(
      (item) => String(item.description || "").trim() && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0
    );
    return hasItem ? "completed" : "incomplete";
  }

  const terms = form.terms || {};
  const required = ["softwareDevelopment", "quotationValidity", "paymentTerms", "warranty", "amcNote"];
  return required.every((key) => String(terms[key] || "").trim()) ? "completed" : "incomplete";
}

export function statusLabel(status) {
  if (status === "static") return "Static";
  if (status === "completed") return "Completed";
  return "Not completed";
}
