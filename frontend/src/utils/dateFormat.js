export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatCoverDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.toLocaleString("en-GB", { month: "long" });
  return `${ordinal(d.getDate())} ${month} , ${d.getFullYear()}`;
}

export function isoDate(date = new Date()) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatShortDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
