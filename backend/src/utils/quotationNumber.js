function padSeq(n) {
  return String(n).padStart(4, "0");
}

function formatQuotationNumber(date = new Date(), sequence = 1) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `CY${yy}${mm}${dd}-${padSeq(sequence)}`;
}

function datePrefix(date = new Date()) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `CY${yy}${mm}${dd}-`;
}

module.exports = { formatQuotationNumber, datePrefix, padSeq };
