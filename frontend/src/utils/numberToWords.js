const ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
  "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function twoDigits(n) {
  n = Math.floor(n);
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return `${TENS[ten]}${one ? ` ${ONES[one]}` : ""}`.trim();
}

function threeDigits(n) {
  n = Math.floor(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundred) parts.push(`${ONES[hundred]} HUNDRED`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" AND ");
}

export function integerToWords(value) {
  if (value === 0) return "ZERO";
  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundred = value % 1000;
  const parts = [];
  if (crore) parts.push(`${twoDigits(crore)} CRORE`);
  if (lakh) parts.push(`${twoDigits(lakh)} LAKH`);
  if (thousand) parts.push(`${twoDigits(thousand)} THOUSAND`);
  if (hundred) {
    const block = threeDigits(hundred);
    if (parts.length && !block.includes("HUNDRED")) parts.push(`AND ${block}`);
    else parts.push(block);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function numberToWords(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) return "RUPEES: ZERO ONLY";
  const rupees = Math.floor(numeric + 1e-9);
  const paise = Math.round((numeric - rupees) * 100);
  let text = `RUPEES: ${integerToWords(rupees)}`;
  if (paise > 0) text += ` AND ${twoDigits(paise)} PAISE`;
  return `${text} ONLY`;
}
