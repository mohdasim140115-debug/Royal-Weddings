import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { bookingAccessToken } from "@/lib/auth";
import { clean, normalizePhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Guest lookup: reference + the mobile number used on the booking.
export const POST = handler(async (request) => {
  limitOrThrow(request, "lookup", { limit: 10, windowMs: 10 * 60_000 });
  const body = await readJson(request);
  const reference = clean(body.reference, 40).toUpperCase();
  const phoneDigits = normalizePhone(body.phone).replace(/\D/g, "").slice(-10);
  if (!reference || phoneDigits.length < 10) return error("Enter your booking reference and mobile number.", 422);
  const b = await prisma.booking.findUnique({ where: { reference }, select: { reference: true, phone: true } });
  if (!b || b.phone.replace(/\D/g, "").slice(-10) !== phoneDigits) {
    return error("We couldn't find a booking with those details.", 404);
  }
  return json({ url: `/bookings/${b.reference}?t=${bookingAccessToken(b.reference)}` });
});
