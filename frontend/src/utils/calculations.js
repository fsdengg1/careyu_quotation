import { round2, toNumber } from "./currency";
import { numberToWords } from "./numberToWords";

export const DEFAULT_GST_PERCENTAGE = 18;

export function isGstExtra(value) {
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return true;
}

export function resolveGstPercentage(value, fallback = DEFAULT_GST_PERCENTAGE) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? round2(n) : fallback;
}

export function calculateQuotation(items = [], freight = 0, installation = 0, gstPercentage = DEFAULT_GST_PERCENTAGE, gstAsExtra = true) {
  const normalizedItems = (items || []).map((item, index) => {
    const unitPrice = round2(toNumber(item.unitPrice, 0));
    const quantity = round2(toNumber(item.quantity, 0));
    return {
      ...item,
      serialNumber: index + 1,
      description: String(item.description || "").trim(),
      unitPrice,
      quantity,
      totalAmount: round2(unitPrice * quantity),
    };
  });

  const extra = isGstExtra(gstAsExtra);
  const subtotal = round2(normalizedItems.reduce((sum, item) => sum + item.totalAmount, 0));
  const freightValue = round2(toNumber(freight, 0));
  const installationCharge = round2(toNumber(installation, 0));
  const totalBasicLanded = round2(subtotal + freightValue + installationCharge);
  const gstValue = resolveGstPercentage(gstPercentage);
  const gstAmount = extra ? 0 : round2((totalBasicLanded * gstValue) / 100);
  const grandTotal = extra ? totalBasicLanded : round2(totalBasicLanded + gstAmount);
  const quotedAmount = extra ? totalBasicLanded : grandTotal;

  return {
    items: normalizedItems,
    subtotal,
    freight: freightValue,
    installationCharge,
    totalBasicLanded,
    gstPercentage: gstValue,
    gstAmount,
    gstAsExtra: extra,
    grandTotal,
    amountInWords: numberToWords(quotedAmount),
    grandTotalInWords: numberToWords(grandTotal),
  };
}

export function validateQuotation(form, { forGenerate = true } = {}) {
  const errors = [];
  if (!String(form.quotationNumber || "").trim()) errors.push("Quotation number is required.");
  if (!form.quotationDate) errors.push("Quotation date is required.");
  if (forGenerate) {
    if (!String(form.projectName || "").trim()) errors.push("Project name is required.");
    if (!String(form.projectLocation || "").trim()) errors.push("Project location is required.");
    if (!String(form.clientCompany || "").trim()) errors.push("Client company is required.");
    const items = form.items || [];
    if (!items.length) errors.push("Add at least one quotation item.");
    items.forEach((item, index) => {
      if (!String(item.description || "").trim()) errors.push(`Item ${index + 1}: description is empty.`);
      if (Number(item.quantity) <= 0) errors.push(`Item ${index + 1}: quantity must be greater than 0.`);
      if (Number(item.unitPrice) < 0) errors.push(`Item ${index + 1}: unit price cannot be negative.`);
    });
  }
  return errors;
}
