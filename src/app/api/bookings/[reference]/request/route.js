import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { getAccessibleBooking } from "@/lib/booking-access";
import { clean, isDate } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Customer-raised reschedule / cancellation request. Staff review it in admin;
// nothing changes on the booking until they act.
export const POST = handler(async (request, { params }) => {
  limitOrThrow(request, "customer-request", { limit: 5, windowMs: 10 * 60_000 });
  const { reference } = await params;
  const body = await readJson(request);
  const booking = await getAccessibleBooking(reference, body.token);
  if (!booking) return error("Booking not found.", 404);
  if (["CANCELLED", "COMPLETED"].includes(booking.status)) return error("This booking can no longer be changed online. Please contact us.", 409);

  const type = body.type === "CANCELLATION" ? "CANCELLATION" : body.type === "RESCHEDULE" ? "RESCHEDULE" : null;
  if (!type) return error("Unknown request type.", 422);
  const message = clean(body.message, 1000);
  if (type === "RESCHEDULE" && !isDate(body.newDate)) return error("Please choose the new date you would like.", 422, { fields: { newDate: "Choose a date." } });

  const note = `[${new Date().toISOString().slice(0, 10)}] Customer requested ${type.toLowerCase()}${type === "RESCHEDULE" ? ` to ${body.newDate}` : ""}${message ? `: ${message}` : ""}`;
  await prisma.booking.update({
    where: { id: booking.id },
    data: { customerRequest: type, internalNotes: [booking.internalNotes, note].filter(Boolean).join("\n") },
  });
  await audit(null, `CUSTOMER_${type}_REQUEST`, "Booking", booking.id, { newDate: body.newDate || null });
  return json({ ok: true });
});
