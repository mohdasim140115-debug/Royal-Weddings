import "server-only";
import { prisma } from "./db.js";
import { notifyBooking } from "./notify.js";

/**
 * Marks a gateway payment as captured exactly once and credits the booking.
 * Safe to call from both the checkout callback and the webhook: the
 * conditional update guarantees a single credit even under races.
 * Returns the updated booking, or null if it was already captured.
 */
export async function captureGatewayPayment({ orderId, paymentId, method, amountPaise }) {
  const payment = await prisma.payment.findUnique({ where: { providerOrderId: orderId } });
  if (!payment) return { ok: false, reason: "UNKNOWN_ORDER" };
  if (amountPaise != null && amountPaise !== payment.amount * 100) {
    console.error("[payments] amount mismatch", orderId, amountPaise, payment.amount);
    return { ok: false, reason: "AMOUNT_MISMATCH" };
  }

  const booking = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "CAPTURED" } },
      data: { status: "CAPTURED", providerPaymentId: paymentId, method: method || null, verifiedAt: new Date(), failureReason: null },
    });
    if (updated.count === 0) return null; // already captured
    return tx.booking.update({ where: { id: payment.bookingId }, data: { amountPaid: { increment: payment.amount } } });
  });

  if (booking) await notifyBooking("PAYMENT_RECEIVED", booking, { amount: payment.amount });
  return { ok: true, booking, alreadyCaptured: !booking };
}

export async function markGatewayPaymentFailed({ orderId, reason }) {
  await prisma.payment.updateMany({
    where: { providerOrderId: orderId, status: "CREATED" },
    data: { status: "FAILED", failureReason: String(reason || "Payment failed").slice(0, 300) },
  });
}
