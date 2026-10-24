import { notFound } from "next/navigation";
import { getAccessibleBooking, balanceDue } from "@/lib/booking-access";
import { formatINR, formatDate, formatDateTime, SERVICE_LABELS } from "@/lib/format";
import { site } from "@/config/site";
import PrintButton from "@/components/booking/PrintButton";

export const metadata = { title: "Payment receipt", robots: { index: false, follow: false } };

export default async function ReceiptPage({ params, searchParams }) {
  const { reference } = await params;
  const { t } = await searchParams;
  const booking = await getAccessibleBooking(reference, t);
  if (!booking) notFound();
  const payments = booking.payments.filter((p) => ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(p.status));
  if (!payments.length) notFound();

  return (
    <div className="container-x pb-24 pt-28 sm:pt-32">
      <div className="mx-auto max-w-3xl border border-line bg-white p-8 sm:p-12 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-6 border-b border-ink pb-6">
          <div>
            <p className="font-display text-3xl">{site.legal.entityName || site.name}</p>
            {site.contact.address && <p className="mt-1 text-xs text-stone">{site.contact.address}</p>}
            {site.legal.gstin && <p className="text-xs text-stone">GSTIN {site.legal.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="eyebrow text-champagne-deep">Payment receipt</p>
            <p className="mt-1 text-sm">{booking.reference}</p>
            <p className="text-xs text-stone">Issued {formatDate(new Date())}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-stone">Received from</p>
            <p className="mt-1">{booking.customerName}</p>
            <p>{booking.email}</p>
            <p>{booking.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-stone">For</p>
            <p className="mt-1">{SERVICE_LABELS[booking.serviceType]} — {booking.eventType}</p>
            <p>Event date {formatDate(booking.eventDate)}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.12em] text-stone">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Method / reference</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="py-3">{formatDateTime(p.verifiedAt || p.createdAt)}</td>
                <td className="py-3">
                  {p.provider === "RAZORPAY" ? "Online (Razorpay)" : p.method || "Manual"}
                  {(p.providerPaymentId || p.reference) && <span className="block text-xs text-stone">{p.providerPaymentId || p.reference}</span>}
                  {p.refundedAmount > 0 && <span className="block text-xs text-burgundy">Refunded {formatINR(p.refundedAmount)}</span>}
                </td>
                <td className="py-3 text-right tabular-nums">{formatINR(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><dt>Booking total</dt><dd>{formatINR(booking.total)}</dd></div>
          <div className="flex justify-between"><dt>Total paid (net)</dt><dd>{formatINR(booking.amountPaid)}</dd></div>
          <div className="flex justify-between border-t border-ink pt-2 font-semibold"><dt>Balance due</dt><dd>{formatINR(balanceDue(booking))}</dd></div>
        </dl>

        <p className="mt-10 text-xs leading-relaxed text-stone">
          This is a payment receipt, not a tax invoice. A tax invoice will be issued as per applicable law.
        </p>
        <div className="mt-8 print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
