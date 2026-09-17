const { round2, toNumber } = require("./currency");
const { numberToWords } = require("./numberToWords");

const DEFAULT_GST_PERCENTAGE = 18;

function isGstExtra(value) {
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return true;
}

function resolveGstPercentage(value, fallback = DEFAULT_GST_PERCENTAGE) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? round2(n) : fallback;
}

function calculateQuotation(items = [], freight = 0, installation = 0, gstPercentage = DEFAULT_GST_PERCENTAGE, gstAsExtra = true) {
  const normalizedItems = (items || []).map((item, index) => {
    const unitPrice = round2(toNumber(item.unitPrice ?? item.unit_price, 0));
    const quantity = round2(toNumber(item.quantity, 0));
    const totalAmount = round2(unitPrice * quantity);
    return {
      ...item,
      serialNumber: index + 1,
      description: String(item.description || "").trim(),
      unitPrice,
      quantity,
      totalAmount,
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

module.exports = { calculateQuotation, isGstExtra, resolveGstPercentage, DEFAULT_GST_PERCENTAGE };
