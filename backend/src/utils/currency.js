function round2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatINR(value, withSymbol = true) {
  const n = round2(value);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
  return withSymbol ? `₹${formatted}` : formatted;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = { round2, formatINR, toNumber };
