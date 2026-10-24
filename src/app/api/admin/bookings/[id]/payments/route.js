import { after } from "next/server";
import { prisma } from "@/lib/db";
import { handler, json, error, readJson } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { notifyBooking } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { clean, int } from "@/lib/validation";

export const dynamic = "force-dynamic";

const METHODS = ["Bank transfer", "UPI", "Cash", "Cheque", "Card (POS)", "Other"];

// Records an offline payment that staff have verified, or a refund against
// an existing payment. Revenue reports use only these verified records.
export const POST = handler(async (request, { params }) => {
  const user = await requireAdminApi({ adminOnly: true });
  const { id } = await params;
  const body = await readJson(request);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return error("Booking not found.", 404);

  if (body.kind === "refund") {
    const payment = await prisma.payment.findFirst({ where: { id: String(body.paymentId || ""), bookingId: id } });
    if (!payment || !["CAPTURED", "PARTIALLY_REFUNDED"].includes(payment.status)) return error("Choose a received payment to refund.", 422);
    const amount = int(body.amount, { min: 1, max: payment.amount - payment.refundedAmount, fallback: 0 });
    if (!amount) return error(`Refund must be between ₹1 and ₹${payment.amount - payment.refundedAmount}.`, 422);
    const refunded = payment.refundedAmount + amount;
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { refundedAmount: refunded, status: refunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED", notes: [payment.notes, `Refund ₹${amount}: ${clean(body.reference, 120)}`].filter(Boolean).join("\n") },
      }),
      prisma.booking.update({ where: { id }, data: { amountPaid: { decrement: amount } } }),
    ]);
    await audit(user.id, "REFUND_RECORDED", "Payment", payment.id, { amount });
    return json({ ok: true });
  }

  const amount = int(body.amount, { min: 1, max: 50_000_000, fallback: 0 });
  if (!amount) return error("Enter the amount received.", 422, { fields: { amount: "Required." } });
  const method = METHODS.includes(body.method) ? body.method : null;
  if (!method) return error("Choose the payment method.", 422, { fields: { method: "Required." } });
  const reference = clean(body.reference, 120);
  if (!reference) return error("Enter the transaction reference (UTR, receipt no., etc.).", 422, { fields: { reference: "Required." } });

  const [, updated] = await prisma.$transaction([
    prisma.payment.create({
      data: { bookingId: id, provider: "MANUAL", amount, status: "CAPTURED", method, reference, notes: clean(body.notes, 500) || null, recordedById: user.id, verifiedAt: new Date() },
    }),
    prisma.booking.update({ where: { id }, data: { amountPaid: { increment: amount } } }),
  ]);
  await audit(user.id, "PAYMENT_RECORDED", "Booking", id, { amount, method, reference });
  after(() => notifyBooking("PAYMENT_RECEIVED", updated, { amount }));
  return json({ ok: true });
});
