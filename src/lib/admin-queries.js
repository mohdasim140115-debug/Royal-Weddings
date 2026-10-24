import { parseDay } from "./format.js";

/** Booking list filters shared by the admin list and CSV export. */
export function bookingWhere(sp = {}) {
  const where = {};
  if (["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(sp.status)) where.status = sp.status;
  if (["CAR", "PHOTOGRAPHY", "VIDEOGRAPHY", "COMBINED"].includes(sp.service)) where.serviceType = sp.service;
  if (sp.request === "1") where.customerRequest = { not: null };
  const from = parseDay(sp.from);
  const to = parseDay(sp.to);
  if (from || to) where.eventDate = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q.replace(/\s/g, "") } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}
