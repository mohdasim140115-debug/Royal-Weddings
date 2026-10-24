import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Panel } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import PriceBreakdown from "@/components/booking/PriceBreakdown";
import { RouteSummary } from "@/components/booking/EstimatePanel";
import BookingActions, { PaymentRecorder } from "@/components/admin/BookingActions";
import { bookingInclude } from "@/lib/booking-access";
import { bookingAccessToken } from "@/lib/auth";
import { formatINR, formatDate, formatDateTime, STATUS_LABELS, SERVICE_LABELS } from "@/lib/format";

export const metadata = { title: "Booking" };

const TONE = { PENDING: "gold", CONFIRMED: "success", COMPLETED: "dark", CANCELLED: "danger" };

export default async function AdminBookingDetail({ params }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { ...bookingInclude, notifications: { orderBy: { createdAt: "desc" }, take: 20 }, user: { select: { email: true } } } });
  if (!booking) notFound();

  const [cars, vendors] = await Promise.all([
    prisma.car.findMany({ where: { isActive: true }, select: { id: true, make: true, model: true, slug: true }, orderBy: { make: "asc" } }),
    prisma.vendor.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }),
  ]);
  const inputs = booking.pricingInputs || {};
  const requestedCarId = cars.find((c) => c.slug === inputs.car?.slug)?.id || null;

  return (
    <>
      <Link href="/admin/bookings" className="inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> Bookings
      </Link>
      <div className="mt-2 mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl">{booking.reference}</h1>
          <p className="mt-1 text-sm text-stone">
            {SERVICE_LABELS[booking.serviceType]} · {booking.eventType} · {formatDate(booking.eventDate)} · created {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={TONE[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
          {booking.quoteRequired && <Badge tone="burgundy">Quote needed</Badge>}
          {booking.customerRequest && <Badge tone="burgundy">{booking.customerRequest} requested</Badge>}
          <Link href={`/bookings/${booking.reference}?t=${bookingAccessToken(booking.reference)}`} target="_blank" className="text-xs uppercase tracking-[0.14em] text-stone underline underline-offset-4 hover:text-ink">Customer view</Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <Panel title="Customer">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-stone">Name</dt><dd>{booking.customerName}</dd></div>
              <div><dt className="text-xs text-stone">Phone</dt><dd><a href={`tel:${booking.phone}`} className="underline underline-offset-4">{booking.phone}</a></dd></div>
              <div><dt className="text-xs text-stone">Email</dt><dd className="break-all"><a href={`mailto:${booking.email}`} className="underline underline-offset-4">{booking.email}</a></dd></div>
              <div><dt className="text-xs text-stone">Account</dt><dd>{booking.user ? booking.user.email : "Guest"}</dd></div>
            </dl>
            {booking.notes && <p className="mt-4 border-t border-line pt-4 text-sm"><span className="text-xs text-stone">Customer notes</span><br />{booking.notes}</p>}
          </Panel>

          <Panel title="Events & journey">
            <ul className="divide-y divide-line text-sm">
              {booking.events.map((e) => (
                <li key={e.id} className="py-3">
                  <p className="font-medium">{e.name} · {formatDate(e.date)}{e.startTime && ` · ${e.startTime}`}</p>
                  {e.pickupAddress && <p>From: {e.pickupAddress}</p>}
                  {Array.isArray(e.stops) && e.stops.map((s, i) => <p key={i}>Stop: {s}</p>)}
                  {e.venue && <p>Venue: {e.venue}</p>}
                  {e.passengers && <p className="text-stone">{e.passengers} passenger(s){e.coverageHours ? ` · ${e.coverageHours} hrs coverage` : ""}</p>}
                </li>
              ))}
            </ul>
            {inputs.trip && (inputs.car || inputs.serviceType === "CAR") && (
              <p className="mt-3 text-xs text-stone">
                {inputs.trip.tripType === "ROUND_TRIP" ? "Round trip" : "One way"} · waiting {inputs.trip.waitingHours} hr{inputs.trip.outstation ? ` · outstation ${inputs.trip.outstationDays} day(s)` : ""} · distance source: {booking.distanceSource}
              </p>
            )}
            {inputs.routeError && <p className="mt-2 text-xs text-burgundy">Route lookup failed: {inputs.routeError.message}</p>}
            {inputs.route && <div className="mt-4"><RouteSummary route={inputs.route} distanceSource={booking.distanceSource} /></div>}
          </Panel>

          <Panel title="Quote at submission">
            <PriceBreakdown quote={booking.priceBreakdown} showDisclaimer={false} />
            {booking.lineItems.some((l) => l.kind === "ADJUSTMENT") && (
              <ul className="mt-4 border-t border-line pt-3 text-sm">
                {booking.lineItems.filter((l) => l.kind === "ADJUSTMENT").map((l) => (
                  <li key={l.id} className="flex justify-between"><span>{l.label}</span><span className="tabular-nums">{l.amount > 0 ? "+" : ""}{formatINR(l.amount)}</span></li>
                ))}
                <li className="mt-2 flex justify-between font-semibold"><span>Current total</span><span>{formatINR(booking.total)}</span></li>
              </ul>
            )}
          </Panel>

          {booking.internalNotes && (
            <Panel title="Activity & internal notes">
              <pre className="whitespace-pre-wrap font-sans text-sm text-charcoal">{booking.internalNotes}</pre>
            </Panel>
          )}

          <Panel title="Notifications">
            {booking.notifications.length === 0 ? (
              <p className="text-sm text-stone">None yet.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {booking.notifications.map((n) => (
                  <li key={n.id} className="flex flex-wrap justify-between gap-2">
                    <span>{n.template.replaceAll("_", " ").toLowerCase()} · {n.channel.toLowerCase()} → {n.recipient}</span>
                    <span className={n.status === "SENT" ? "text-success" : n.status === "FAILED" ? "text-danger" : "text-stone"}>{n.status === "SKIPPED" ? "Skipped (not configured)" : n.status}{n.error && n.status === "FAILED" ? `: ${n.error}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <BookingActions booking={{ id: booking.id, status: booking.status, assignedCarId: booking.assignedCarId, assignedVendorId: booking.assignedVendorId, total: booking.total, advanceAmount: booking.advanceAmount, advanceApproved: booking.advanceApproved, customerRequest: booking.customerRequest }} cars={cars} vendors={vendors} requestedCarId={requestedCarId} />

          <Panel title="Payments">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt>Total</dt><dd>{formatINR(booking.total)}</dd></div>
              <div className="flex justify-between"><dt>Verified paid</dt><dd>{formatINR(booking.amountPaid)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Balance</dt><dd>{formatINR(Math.max(0, booking.total - booking.amountPaid))}</dd></div>
            </dl>
            <ul className="mt-4 divide-y divide-line border-y border-line text-xs">
              {booking.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span>{formatDateTime(p.createdAt)} · {p.provider}{p.method ? ` · ${p.method}` : ""}<span className="block text-stone">{p.reference || p.providerPaymentId || p.providerOrderId}</span>{p.failureReason && <span className="block text-danger">{p.failureReason}</span>}</span>
                  <span className="text-right">{formatINR(p.amount)}<span className="block text-stone">{p.status}{p.refundedAmount ? ` · refunded ${formatINR(p.refundedAmount)}` : ""}</span></span>
                </li>
              ))}
              {booking.payments.length === 0 && <li className="py-2 text-stone">No payments yet.</li>}
            </ul>
            <div className="mt-5">
              <PaymentRecorder bookingId={booking.id} payments={booking.payments.map((p) => ({ id: p.id, amount: p.amount, status: p.status, method: p.method, provider: p.provider, reference: p.reference, providerPaymentId: p.providerPaymentId }))} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
