import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { captureGatewayPayment, markGatewayPaymentFailed } from "@/lib/payments";
import { audit } from "@/lib/audit";
import { json, error } from "@/lib/http";

export const dynamic = "force-dynamic";

// Razorpay webhook. Configure in the Razorpay dashboard with events:
// payment.captured, payment.failed, refund.processed — and set
// RAZORPAY_WEBHOOK_SECRET. The raw body is verified before anything is read.
export async function POST(request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) return error("Invalid signature.", 401);

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return error("Bad payload.", 400);
  }

  try {
    if (event.event === "payment.captured") {
      const p = event.payload?.payment?.entity;
      if (p?.order_id) await captureGatewayPayment({ orderId: p.order_id, paymentId: p.id, method: p.method, amountPaise: p.amount });
    } else if (event.event === "payment.failed") {
      const p = event.payload?.payment?.entity;
      if (p?.order_id) await markGatewayPaymentFailed({ orderId: p.order_id, reason: p.error_description });
    } else if (event.event === "refund.processed") {
      const r = event.payload?.refund?.entity;
      const seen = r?.id && (await prisma.auditLog.findFirst({ where: { entity: "RazorpayRefund", entityId: r.id } }));
      if (r?.payment_id && !seen) {
        const payment = await prisma.payment.findUnique({ where: { providerPaymentId: r.payment_id } });
        if (payment) {
          const refunded = Math.min(payment.amount, payment.refundedAmount + Math.round(r.amount / 100));
          const delta = refunded - payment.refundedAmount;
          await prisma.$transaction([
            prisma.payment.update({ where: { id: payment.id }, data: { refundedAmount: refunded, status: refunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED" } }),
            prisma.booking.update({ where: { id: payment.bookingId }, data: { amountPaid: { decrement: delta } } }),
          ]);
          await audit(null, "REFUND_PROCESSED", "RazorpayRefund", r.id, { paymentId: payment.id, amount: delta });
        }
      }
    }
  } catch (e) {
    console.error("[webhook]", e);
    return error("Processing error.", 500); // Razorpay will retry
  }
  return json({ ok: true });
}
