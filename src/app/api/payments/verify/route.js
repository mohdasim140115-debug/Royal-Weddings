import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { getAccessibleBooking } from "@/lib/booking-access";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { captureGatewayPayment } from "@/lib/payments";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Called by the checkout handler. Success is recorded ONLY after the HMAC
// signature (order_id|payment_id) matches using our secret key.
export const POST = handler(async (request) => {
  limitOrThrow(request, "pay-verify", { limit: 20 });
  const body = await readJson(request);
  const booking = await getAccessibleBooking(body.reference, body.token);
  if (!booking) return error("Booking not found.", 404);

  const orderId = String(body.razorpay_order_id || "");
  const paymentId = String(body.razorpay_payment_id || "");
  const signature = String(body.razorpay_signature || "");
  const payment = await prisma.payment.findUnique({ where: { providerOrderId: orderId } });
  if (!payment || payment.bookingId !== booking.id) return error("Payment not recognised for this booking.", 400);

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    await prisma.payment.updateMany({ where: { id: payment.id, status: "CREATED" }, data: { status: "FAILED", failureReason: "Signature verification failed" } });
    return error("Payment verification failed. No amount has been recorded.", 400);
  }

  const result = await captureGatewayPayment({ orderId, paymentId });
  if (!result.ok) return error("Payment could not be recorded. Our team will reconcile it.", 409);
  return json({ ok: true });
});
