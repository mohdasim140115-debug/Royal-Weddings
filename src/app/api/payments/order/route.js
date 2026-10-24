import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { getAccessibleBooking, balanceDue } from "@/lib/booking-access";
import { razorpayConfigured, createOrder, publicKeyId } from "@/lib/razorpay";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

// Creates a Razorpay order for the approved amount. The amount is decided
// here from the stored booking — never from the client.
export const POST = handler(async (request) => {
  limitOrThrow(request, "pay-order", { limit: 10 });
  if (!razorpayConfigured()) return error("Online payments are not enabled yet. Please contact us to pay.", 503);
  const body = await readJson(request);
  const booking = await getAccessibleBooking(body.reference, body.token);
  if (!booking) return error("Booking not found.", 404);
  if (booking.status === "CANCELLED") return error("This booking is cancelled.", 409);
  if (!booking.advanceApproved) return error("Payment for this booking has not been approved yet.", 409);

  const due = balanceDue(booking);
  // Before any payment: the approved advance. After that: the remaining balance.
  const amount = booking.amountPaid < booking.advanceAmount ? Math.min(booking.advanceAmount - booking.amountPaid, due) : due;
  if (amount <= 0) return error("Nothing is due on this booking.", 409);

  const order = await createOrder({ amount, receipt: booking.reference, notes: { bookingId: booking.id, reference: booking.reference } });
  await prisma.payment.create({
    data: { bookingId: booking.id, provider: "RAZORPAY", providerOrderId: order.id, amount, status: "CREATED" },
  });

  return json({
    orderId: order.id,
    amount,
    keyId: publicKeyId(),
    businessName: site.name,
    prefill: { name: booking.customerName, email: booking.email, contact: booking.phone },
  });
});
