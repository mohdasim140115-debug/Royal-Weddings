import { after } from "next/server";
import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { buildQuote, normaliseQuoteInput, QuoteError } from "@/lib/quote-service";
import { validateContact, clean, int, isDate, isTime, EVENT_TYPES, hasErrors } from "@/lib/validation";
import { parseDay, todayInIndia } from "@/lib/format";
import { bookingReference } from "@/lib/reference";
import { bookingAccessToken, getCurrentUser } from "@/lib/auth";
import { notifyBooking } from "@/lib/notify";
import { business } from "@/config/site";

export const dynamic = "force-dynamic";

const KEY_RE = /^[A-Za-z0-9-]{16,64}$/;

const RESPONSE_FIELDS = { reference: true, total: true, advanceAmount: true, advanceApproved: true, quoteRequired: true, eventDate: true };

function respond(booking, status = 201, duplicate = false) {
  const token = bookingAccessToken(booking.reference);
  return json(
    {
      reference: booking.reference,
      token,
      url: `/bookings/${booking.reference}?t=${token}`,
      total: booking.total,
      advanceAmount: booking.advanceAmount,
      advanceApproved: booking.advanceApproved,
      quoteRequired: booking.quoteRequired,
      duplicate,
    },
    status
  );
}

export const POST = handler(async (request) => {
  limitOrThrow(request, "booking", { limit: 8, windowMs: 10 * 60_000 });
  const body = await readJson(request, 100_000);

  // ── Duplicate-submission protection ───────────────────────
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
  if (!KEY_RE.test(idempotencyKey)) return error("Invalid request token. Please reload the page.", 400);
  const existing = await prisma.booking.findUnique({ where: { idempotencyKey }, select: RESPONSE_FIELDS });
  if (existing) return respond(existing, 200, true);

  // ── Validation ────────────────────────────────────────────
  const { errors, value: contact } = validateContact(body.contact);
  const today = todayInIndia();
  const input = normaliseQuoteInput(body.quoteInput);
  if (!input.eventDate) errors.eventDate = "Please choose the event date.";
  else if (input.eventDate < today) errors.eventDate = "The event date cannot be in the past.";
  const eventType = EVENT_TYPES.includes(body.eventType) ? body.eventType : null;
  if (!eventType) errors.eventType = "Please choose the event type.";
  if (body.acceptTerms !== true) errors.acceptTerms = "Please accept the terms and cancellation policy.";

  const needsTrip = input.serviceType === "CAR" || (input.serviceType === "COMBINED" && input.car);
  if (needsTrip) {
    if (!input.trip.pickup) errors.pickup = "Please enter the pickup address.";
    if (!input.trip.venue) errors.venue = "Please enter the venue or destination.";
    if (!input.trip.pickupTime) errors.pickupTime = "Please choose a pickup time.";
  }

  const extraEvents = (Array.isArray(body.events) ? body.events : []).slice(0, 6).map((e, i) => {
    const ev = {
      name: EVENT_TYPES.includes(e?.name) ? e.name : "Other",
      date: isDate(e?.date) ? e.date : null,
      startTime: isTime(e?.startTime) ? e.startTime : null,
      venue: clean(e?.venue, 200) || null,
      coverageHours: int(e?.coverageHours, { min: 0, max: 24 }) || null,
    };
    if (!ev.date || ev.date < today) errors[`events.${i}.date`] = "Each additional event needs a valid future date.";
    return ev;
  });

  if (hasErrors(errors)) return error("Please check the highlighted fields.", 422, { fields: errors });

  // ── Authoritative quote ───────────────────────────────────
  let result;
  try {
    result = await buildQuote(input, { requireRoute: needsTrip });
  } catch (e) {
    if (e instanceof QuoteError) return error(e.message, 422, { code: e.code, fields: e.field ? { [e.field]: e.message } : undefined });
    throw e;
  }
  const { quote } = result;
  const quoteRequired = result.quoteRequired || quote.quoteOnlyItems.length > 0;
  const user = await getCurrentUser();
  const couponApplied = quote.coupon?.valid ? input.couponCode : null;

  // ── Persist (transaction) ─────────────────────────────────
  let booking;
  for (let attempt = 0; attempt < 3 && !booking; attempt++) {
    try {
      booking = await prisma.$transaction(async (tx) => {
        if (couponApplied) {
          // Atomically consume one coupon use; fail if the limit was reached meanwhile.
          const coupon = await tx.coupon.findUnique({ where: { code: couponApplied } });
          const updated = await tx.coupon.updateMany({
            where: { code: couponApplied, isActive: true, ...(coupon?.usageLimit != null ? { usedCount: { lt: coupon.usageLimit } } : {}) },
            data: { usedCount: { increment: 1 } },
          });
          if (updated.count === 0) throw new QuoteError("This coupon is no longer available. Please remove it and try again.", "COUPON_EXHAUSTED", "couponCode");
        }

        return tx.booking.create({
          data: {
            reference: bookingReference(),
            idempotencyKey,
            userId: user?.id ?? null,
            serviceType: input.serviceType,
            customerName: contact.customerName,
            phone: contact.phone,
            email: contact.email,
            eventDate: parseDay(input.eventDate),
            eventType,
            notes: clean(body.notes, 2000) || null,
            subtotal: quote.subtotal,
            discountTotal: quote.discountTotal,
            taxTotal: quote.tax,
            total: quote.total,
            advanceAmount: quote.advance,
            advanceApproved: business.allowInstantAdvance && !quoteRequired && quote.total > 0,
            quoteRequired,
            distanceSource: result.distanceSource,
            couponCode: couponApplied,
            pricingInputs: { ...input, route: result.route, routeError: result.routeError },
            priceBreakdown: quote,
            termsAcceptedAt: new Date(),
            lineItems: { create: result.lineItems.map((li, i) => ({ ...li, quantity: li.quantity || 1, sortOrder: i })) },
            events: {
              create: [
                {
                  name: eventType,
                  date: parseDay(input.eventDate),
                  startTime: input.trip.pickupTime,
                  venue: input.trip.venue || null,
                  pickupAddress: input.trip.pickup || null,
                  stops: input.trip.stops.length ? input.trip.stops : undefined,
                  passengers: needsTrip ? input.trip.passengers : null,
                  coverageHours: int(body.coverageHours, { min: 0, max: 24 }) || null,
                  sortOrder: 0,
                },
                ...extraEvents.map((e, i) => ({ ...e, date: parseDay(e.date), sortOrder: i + 1 })),
              ],
            },
          },
        });
      });
    } catch (e) {
      if (e instanceof QuoteError) return error(e.message, 409, { code: e.code });
      if (e?.code === "P2002") {
        const target = String(e.meta?.target || "");
        if (target.includes("idempotency")) {
          const dup = await prisma.booking.findUnique({ where: { idempotencyKey }, select: RESPONSE_FIELDS });
          if (dup) return respond(dup, 200, true);
        }
        continue; // reference collision — retry with a new reference
      }
      throw e;
    }
  }
  if (!booking) return error("We couldn't save your booking. Please try again.", 500);

  after(() => notifyBooking("BOOKING_RECEIVED", booking));
  return respond(booking);
});
