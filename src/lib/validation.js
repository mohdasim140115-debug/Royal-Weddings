// Lightweight validation helpers shared by the client (instant feedback)
// and the server (authoritative). The server always re-validates.

export const EVENT_TYPES = ["Wedding", "Reception", "Engagement", "Mehendi", "Haldi", "Sangeet", "Pre-wedding shoot", "Baraat", "Other"];
export const SERVICE_TYPES = ["CAR", "PHOTOGRAPHY", "VIDEOGRAPHY", "COMBINED"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{8,15}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isEmail = (v) => typeof v === "string" && EMAIL_RE.test(v.trim()) && v.length <= 160;
export const isPhone = (v) => typeof v === "string" && PHONE_RE.test(v.trim()) && v.replace(/\D/g, "").length >= 10;
export const isTime = (v) => typeof v === "string" && TIME_RE.test(v);
export const isDate = (v) => typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());

export function normalizePhone(v) {
  return String(v || "").replace(/[\s-]/g, "");
}

export function clean(v, max = 500) {
  if (v == null) return "";
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

export function int(v, { min = 0, max = 1_000_000, fallback = 0 } = {}) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Is this YYYY-MM-DD date today or later (in India)? */
export function isFutureOrToday(day, today) {
  return isDate(day) && day >= today;
}

/**
 * Validates contact + event details. Returns { errors, value }.
 */
export function validateContact(input = {}) {
  const errors = {};
  const value = {
    customerName: clean(input.customerName, 120),
    phone: normalizePhone(clean(input.phone, 20)),
    email: clean(input.email, 160).toLowerCase(),
  };
  if (value.customerName.length < 2) errors.customerName = "Please enter your full name.";
  if (!isPhone(value.phone)) errors.phone = "Enter a valid mobile number, e.g. +91 98765 43210.";
  if (!isEmail(value.email)) errors.email = "Enter a valid email address.";
  return { errors, value };
}

export function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 200) return "Password is too long.";
  return null;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
