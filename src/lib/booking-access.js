import "server-only";
import { prisma } from "./db.js";
import { getCurrentUser, isStaff, verifyBookingAccessToken } from "./auth.js";

export const bookingInclude = {
  lineItems: { orderBy: { sortOrder: "asc" } },
  events: { orderBy: { sortOrder: "asc" } },
  payments: { orderBy: { createdAt: "desc" } },
  assignedCar: { select: { make: true, model: true, slug: true } },
};

/**
 * Loads a booking only if the requester may see it: staff, the signed-in
 * owner, or a guest holding the booking's signed access token.
 * Returns null otherwise (callers respond 404 to avoid leaking existence).
 */
export async function getAccessibleBooking(reference, token) {
  if (typeof reference !== "string" || reference.length > 40) return null;
  const booking = await prisma.booking.findUnique({ where: { reference }, include: bookingInclude });
  if (!booking) return null;
  const user = await getCurrentUser();
  const allowed = isStaff(user) || (user && booking.userId === user.id) || verifyBookingAccessToken(reference, token);
  return allowed ? booking : null;
}

export const balanceDue = (b) => Math.max(0, b.total - b.amountPaid);
