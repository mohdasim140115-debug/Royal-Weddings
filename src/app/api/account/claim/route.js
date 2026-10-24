import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
import { clean, normalizePhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Attach a guest booking to the signed-in account. Requires the same proof
// as a guest lookup (reference + the mobile number on the booking).
export const POST = handler(async (request) => {
  limitOrThrow(request, "claim", { limit: 10, windowMs: 10 * 60_000 });
  const user = await getCurrentUser();
  if (!user) return error("Please sign in.", 401);
  const body = await readJson(request);
  const reference = clean(body.reference, 40).toUpperCase();
  const digits = normalizePhone(body.phone).replace(/\D/g, "").slice(-10);
  const b = await prisma.booking.findUnique({ where: { reference } });
  if (!b || b.phone.replace(/\D/g, "").slice(-10) !== digits) return error("We couldn't find a booking with those details.", 404);
  if (b.userId && b.userId !== user.id) return error("This booking is linked to another account.", 409);
  await prisma.booking.update({ where: { id: b.id }, data: { userId: user.id } });
  return json({ ok: true });
});
