const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatINR(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return inr.format(Number(amount));
}

export function formatDate(value, opts = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...opts }).format(d);
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function formatDuration(minutes) {
  const m = Math.round(Number(minutes) || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}

export const STATUS_LABELS = {
  PENDING: "Request received",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SERVICE_LABELS = {
  CAR: "Wedding car",
  PHOTOGRAPHY: "Photography",
  VIDEOGRAPHY: "Videography",
  COMBINED: "Combined package",
};

export const LUXURY_LABELS = { budget: "Value", premium: "Premium", luxury: "Luxury", ultra: "Ultra-luxury" };

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parses "YYYY-MM-DD" into a Date at 00:00 UTC (calendar day). */
export function parseDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDayString(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function todayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return parts; // YYYY-MM-DD
}
