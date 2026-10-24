import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { LogoutButton, ClaimBookingForm } from "@/components/account/AccountActions";
import { requireCustomerPage, bookingAccessToken, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR, formatDate, STATUS_LABELS, SERVICE_LABELS } from "@/lib/format";

export const metadata = { title: "My account", robots: { index: false } };

const TONE = { PENDING: "gold", CONFIRMED: "success", COMPLETED: "dark", CANCELLED: "danger" };

export default async function AccountPage() {
  const user = await requireCustomerPage("/account");
  // Ownership check: only bookings linked to this user id.
  const bookings = await prisma.booking.findMany({ where: { userId: user.id }, orderBy: { eventDate: "asc" } });

  return (
    <>
      <PageHeader eyebrow="My account" title={`Hello, ${user.name.split(" ")[0]}`} crumbs={[{ label: "Account" }]}>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <p className="text-sm text-stone">{user.email}</p>
          {isStaff(user) && <Link href="/admin" className="text-xs font-semibold uppercase tracking-[0.14em] underline decoration-champagne underline-offset-4">Admin dashboard</Link>}
          <LogoutButton />
        </div>
      </PageHeader>
      <section className="container-x py-12 lg:py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl">Your bookings</h2>
          <Link href="/booking" className="inline-flex min-h-11 items-center bg-ink px-5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ivory">New booking</Link>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-6 text-stone">No bookings yet. Bookings you make while signed in appear here automatically.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link href={`/bookings/${b.reference}?t=${bookingAccessToken(b.reference)}`} className="grid gap-2 py-5 transition-colors hover:bg-sand/50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8 sm:px-2">
                  <span>
                    <span className="block font-display text-2xl">{b.reference}</span>
                    <span className="text-sm text-stone">{SERVICE_LABELS[b.serviceType]} · {b.eventType} · {formatDate(b.eventDate)}</span>
                  </span>
                  <span className="text-sm tabular-nums">{formatINR(b.total)}<span className="block text-xs text-stone">Paid {formatINR(b.amountPaid)}</span></span>
                  <Badge tone={TONE[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-14 max-w-3xl border border-line bg-white p-6">
          <h3 className="text-2xl">Booked as a guest?</h3>
          <p className="mt-1 text-sm text-stone">Add an earlier booking to your account using its reference and the mobile number you used.</p>
          <div className="mt-5"><ClaimBookingForm /></div>
        </div>
      </section>
    </>
  );
}
