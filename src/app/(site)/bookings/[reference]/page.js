import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Printer } from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Badge from "@/components/ui/Badge";
import Notice from "@/components/ui/Notice";
import PriceBreakdown from "@/components/booking/PriceBreakdown";
import PayButton from "@/components/booking/PayButton";
import ChangeRequestForm from "@/components/booking/ChangeRequestForm";
import { getAccessibleBooking, balanceDue } from "@/lib/booking-access";
import { bookingAccessToken } from "@/lib/auth";
import { razorpayConfigured } from "@/lib/razorpay";
import { formatINR, formatDate, formatDateTime, STATUS_LABELS, SERVICE_LABELS } from "@/lib/format";
import { whatsappLink } from "@/config/site";

export const metadata = { title: "Your booking", robots: { index: false, follow: false } };

const STATUS_TONE = { PENDING: "gold", CONFIRMED: "success", COMPLETED: "dark", CANCELLED: "danger" };
const PAYMENT_LABEL = { CREATED: "Started", CAPTURED: "Received", FAILED: "Failed", REFUNDED: "Refunded", PARTIALLY_REFUNDED: "Partly refunded" };

export default async function BookingStatusPage({ params, searchParams }) {
  const { reference } = await params;
  const { t } = await searchParams;
  const booking = await getAccessibleBooking(reference, t);
  if (!booking) notFound();

  const token = bookingAccessToken(booking.reference);
  const due = balanceDue(booking);
  const canPay = razorpayConfigured() && booking.advanceApproved && booking.status !== "CANCELLED" && due > 0;
  const nextAmount = booking.amountPaid < booking.advanceAmount ? Math.min(booking.advanceAmount - booking.amountPaid, due) : due;
  const captured = booking.payments.filter((p) => ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(p.status));
  const wa = whatsappLink(`Hello, I have a question about booking ${booking.reference}.`);
  const steps = ["PENDING", "CONFIRMED", "COMPLETED"];
  const currentIdx = steps.indexOf(booking.status);

  return (
    <div className="container-x pb-24 pt-28 sm:pt-32">
      <Breadcrumbs items={[{ label: "Bookings", href: "/bookings/lookup" }, { label: booking.reference }]} />

      <header className="mt-8 flex flex-col justify-between gap-6 border-b border-line pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow text-champagne-deep">{SERVICE_LABELS[booking.serviceType]}</p>
          <h1 className="mt-2 text-5xl">Booking {booking.reference}</h1>
          <p className="mt-2 text-stone">
            {booking.eventType} · {formatDate(booking.eventDate)} · requested {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
          {booking.customerRequest && <Badge tone="burgundy">{booking.customerRequest === "RESCHEDULE" ? "Reschedule requested" : "Cancellation requested"}</Badge>}
        </div>
      </header>

      {booking.status !== "CANCELLED" && (
        <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Booking progress">
          {["Request received", "Confirmed", "Completed"].map((label, i) => (
            <li key={label}>
              <span className={`block h-0.5 ${i <= currentIdx ? "bg-ink" : "bg-line"}`} />
              <span className={`mt-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${i <= currentIdx ? "text-ink" : "text-stone/60"}`}>{label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          {booking.status === "PENDING" && (
            <Notice title="This is a booking request">
              We are checking availability{booking.quoteRequired ? " and preparing your final quote" : ""}. Your reservation is confirmed only once we confirm it with you.
            </Notice>
          )}
          {booking.status === "CANCELLED" && <Notice tone="warning" title="This booking has been cancelled">Any refund due is processed as per our cancellation policy.</Notice>}

          <section className="border border-line bg-white p-6">
            <h2 className="text-3xl">Event details</h2>
            <ul className="mt-4 divide-y divide-line">
              {booking.events.map((e) => (
                <li key={e.id} className="grid gap-1 py-4 text-sm sm:grid-cols-[160px_1fr]">
                  <span className="font-semibold">
                    {e.name}
                    <span className="block font-normal text-stone">
                      {formatDate(e.date)}
                      {e.startTime && ` · ${e.startTime}`}
                    </span>
                  </span>
                  <span className="text-charcoal">
                    {e.pickupAddress && <span className="block">From: {e.pickupAddress}</span>}
                    {Array.isArray(e.stops) && e.stops.map((s, i) => <span key={i} className="block">Stop: {s}</span>)}
                    {e.venue && <span className="block">Venue: {e.venue}</span>}
                    {e.passengers && <span className="block">{e.passengers} passenger(s)</span>}
                  </span>
                </li>
              ))}
            </ul>
            {booking.assignedCar && (
              <p className="mt-2 text-sm">
                Assigned car:{" "}
                <Link href={`/cars/${booking.assignedCar.slug}`} className="underline decoration-champagne underline-offset-4">
                  {booking.assignedCar.make} {booking.assignedCar.model}
                </Link>
              </p>
            )}
          </section>

          <section className="border border-line bg-white p-6">
            <h2 className="text-3xl">Price breakdown</h2>
            <p className="mt-1 text-xs text-stone">As calculated when you submitted your request{booking.quoteRequired ? " — some items will be finalised by our team" : ""}.</p>
            <div className="mt-5">
              <PriceBreakdown quote={booking.priceBreakdown} />
            </div>
            {booking.total !== booking.priceBreakdown?.total && <p className="mt-3 text-sm font-medium">Updated quote from our team: {formatINR(booking.total)}</p>}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <section className="border border-ink bg-white p-6">
            <h2 className="text-3xl">Payments</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Total</dt><dd className="tabular-nums">{formatINR(booking.total)}</dd></div>
              <div className="flex justify-between"><dt>Paid (verified)</dt><dd className="tabular-nums">{formatINR(booking.amountPaid)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Balance</dt><dd className="tabular-nums">{formatINR(due)}</dd></div>
            </dl>
            {booking.payments.length > 0 && (
              <ul className="mt-5 space-y-2 border-t border-line pt-4 text-xs">
                {booking.payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span>
                      {formatDateTime(p.createdAt)} · {p.provider === "MANUAL" ? p.method || "Manual" : "Online"}
                      {p.providerPaymentId && <span className="block text-stone">Ref {p.providerPaymentId}</span>}
                    </span>
                    <span className="text-right tabular-nums">
                      {formatINR(p.amount)}
                      <span className="block text-stone">{PAYMENT_LABEL[p.status]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6">
              {canPay ? (
                <PayButton reference={booking.reference} token={token} amount={nextAmount} label={booking.amountPaid > 0 ? "Pay balance" : "Pay advance"} />
              ) : booking.status !== "CANCELLED" && due > 0 ? (
                <p className="text-xs leading-relaxed text-stone">
                  {!booking.advanceApproved ? "We will share the advance amount once your quote is confirmed." : "Online payment is not enabled yet — we will share payment options with you directly."}
                </p>
              ) : null}
            </div>
            {captured.length > 0 && (
              <Link href={`/bookings/${booking.reference}/receipt?t=${token}`} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal hover:text-champagne-deep">
                <Printer className="size-4" aria-hidden="true" /> Download receipt
              </Link>
            )}
          </section>

          {!["CANCELLED", "COMPLETED"].includes(booking.status) && (
            <section className="border border-line bg-white p-6">
              <h2 className="text-2xl">Need to change something?</h2>
              <div className="mt-4">
                <ChangeRequestForm reference={booking.reference} token={token} pending={booking.customerRequest} />
              </div>
            </section>
          )}

          <section className="border border-line bg-sand/60 p-6 text-sm">
            <h2 className="text-2xl">Support</h2>
            <p className="mt-2 text-stone">Quote your reference {booking.reference} when you contact us.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex min-h-11 items-center border border-ink px-4 text-xs font-semibold uppercase tracking-[0.14em]">Contact us</Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 bg-ink px-4 text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                  <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
                </a>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
