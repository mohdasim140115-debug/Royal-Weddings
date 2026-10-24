import crypto from "node:crypto";

// Booking reference like RW-26K-7Q3XHM — no ambiguous characters.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function bookingReference(date = new Date()) {
  const bytes = crypto.randomBytes(6);
  const tail = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  const yy = String(date.getUTCFullYear()).slice(2);
  const month = "ABCDEFGHJKLM"[date.getUTCMonth()];
  return `RW-${yy}${month}-${tail}`;
}
