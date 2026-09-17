function sanitizePart(value) {
  return String(value || "")
    .replace(/&/g, "AND")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 60);
}

function buildPdfFilename(quotation) {
  const number = sanitizePart(quotation.quotationNumber || "QUOTATION") || "QUOTATION";
  const client = sanitizePart(quotation.clientCompany || quotation.clientName) || "CLIENT";
  const project = sanitizePart(quotation.projectName) || "PROJECT";
  return `${number}_${client}_${project}.pdf`;
}

module.exports = { buildPdfFilename, sanitizePart };
