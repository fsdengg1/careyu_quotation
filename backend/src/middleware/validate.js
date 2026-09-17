function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

const STATUSES = ["draft", "generated", "sent", "approved", "rejected", "cancelled"];

function validateQuotationPayload(body, { forGenerate = false } = {}) {
  const errors = [];
  const quotationNumber = String(body.quotationNumber || "").trim();
  const quotationDate = body.quotationDate;
  const projectName = String(body.projectName || "").trim();
  const projectLocation = String(body.projectLocation || "").trim();
  const clientName = String(body.clientName || "").trim();
  const clientCompany = String(body.clientCompany || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!quotationNumber) errors.push("Quotation number is required.");
  if (!quotationDate) errors.push("Quotation date is empty.");
  if (quotationDate && Number.isNaN(new Date(quotationDate).getTime())) {
    errors.push("Quotation date is invalid.");
  }

  if (forGenerate) {
    if (!projectName) errors.push("Project name is required.");
    if (!projectLocation) errors.push("Project location is required.");
    if (!clientCompany) errors.push("Client company is required.");
    if (!items.length) errors.push("At least one quotation item is required.");
  }

  items.forEach((item, index) => {
    const description = String(item.description || "").trim();
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice ?? item.unit_price);
    if (forGenerate && !description) {
      errors.push(`Item ${index + 1}: description is empty.`);
    }
    if (Number.isFinite(quantity) && quantity <= 0 && (forGenerate || description)) {
      errors.push(`Item ${index + 1}: quantity must be greater than 0.`);
    }
    if (Number.isFinite(unitPrice) && unitPrice < 0) {
      errors.push(`Item ${index + 1}: unit price cannot be negative.`);
    }
  });

  if (body.status && !STATUSES.includes(body.status)) {
    errors.push("Invalid quotation status.");
  }

  const freight = Number(body.freight ?? 0);
  const installationCharge = Number(body.installationCharge ?? body.installation_charge ?? 0);
  const gstPercentage = Number(body.gstPercentage ?? body.gst_percentage ?? 18);
  if (freight < 0) errors.push("Freight cannot be negative.");
  if (installationCharge < 0) errors.push("Installation charge cannot be negative.");
  if (gstPercentage < 0) errors.push("GST percentage cannot be negative.");
  if (body.gstAsExtra != null && typeof body.gstAsExtra !== "boolean" && !["true", "false", 0, 1, "0", "1"].includes(body.gstAsExtra)) {
    errors.push("GST handling must be Extra or Include in total.");
  }

  return { errors, STATUSES };
}

function validateCustomer(body) {
  const errors = [];
  if (!String(body.customerName || body.companyName || "").trim()) {
    errors.push("Customer name or company name is required.");
  }
  return errors;
}

module.exports = { httpError, validateQuotationPayload, validateCustomer, STATUSES };
