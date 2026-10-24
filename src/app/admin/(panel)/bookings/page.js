import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader, Table, linkBtn } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import { bookingWhere } from "@/lib/admin-queries";
import { formatINR, formatDate, STATUS_LABELS, SERVICE_LABELS } from "@/lib/format";

export const metadata = { title: "Bookings" };

const TONE = { PENDING: "gold", CONFIRMED: "success", COMPLETED: "dark", CANCELLED: "danger" };
const PAGE = 25;

export default async function AdminBookingsPage({ searchParams }) {
  const sp = await searchParams;
  const where = bookingWhere(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const [rows, total] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: [{ eventDate: "asc" }], skip: (page - 1) * PAGE, take: PAGE }),
    prisma.booking.count({ where }),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => k !== "page" && typeof v === "string" && v));
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <>
      <AdminHeader
        title="Bookings"
        intro={`${total} booking${total === 1 ? "" : "s"} match`}
        actions={
          <a href={`/api/admin/bookings/export?${qs}`} className={linkBtn}>
            <Download className="size-4" aria-hidden="true" /> Export CSV
          </a>
        }
      />

      <form method="get" className="mb-6 grid gap-3 border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="lg:col-span-2">
          <span className="sr-only">Search</span>
          <input name="q" defaultValue={sp.q || ""} placeholder="Reference, name, phone or email" className="field min-h-11 py-2 text-sm" />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={sp.status || ""} className="field min-h-11 py-2 text-sm">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Service</span>
          <select name="service" defaultValue={sp.service || ""} className="field min-h-11 py-2 text-sm">
            <option value="">All services</option>
            {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-xs text-stone">From</span>
          <input type="date" name="from" defaultValue={sp.from || ""} className="field min-h-11 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-xs text-stone">To</span>
          <input type="date" name="to" defaultValue={sp.to || ""} className="field min-h-11 py-2 text-sm" />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm lg:col-span-2">
          <input type="checkbox" name="request" value="1" defaultChecked={sp.request === "1"} className="size-4 accent-[#09243d]" /> Only customer change requests
        </label>
        <div className="flex gap-2 lg:col-span-4 lg:justify-end">
          <Link href="/admin/bookings" className="inline-flex min-h-11 items-center px-4 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">Reset</Link>
          <button type="submit" className="inline-flex min-h-11 items-center bg-ink px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ivory">Filter</button>
        </div>
      </form>

      <div className="border border-line bg-white">
        <Table head={["Event date", "Reference", "Customer", "Service", "Total", "Paid", "Status"]} empty={!rows.length && <p className="p-6 text-sm text-stone">No bookings match these filters.</p>}>
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-sand/50">
              <td className="px-3 py-3 whitespace-nowrap">{formatDate(b.eventDate, { day: "numeric", month: "short", year: "numeric" })}</td>
              <td className="px-3 py-3">
                <Link href={`/admin/bookings/${b.id}`} className="font-medium underline decoration-champagne underline-offset-4">{b.reference}</Link>
                {b.quoteRequired && <span className="block text-xs text-burgundy">Quote needed</span>}
              </td>
              <td className="px-3 py-3">{b.customerName}<span className="block text-xs text-stone">{b.phone}</span></td>
              <td className="px-3 py-3">{SERVICE_LABELS[b.serviceType]}</td>
              <td className="px-3 py-3 tabular-nums">{formatINR(b.total)}</td>
              <td className="px-3 py-3 tabular-nums">{formatINR(b.amountPaid)}</td>
              <td className="px-3 py-3">
                <Badge tone={TONE[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                {b.customerRequest && <span className="mt-1 block text-xs text-burgundy">{b.customerRequest === "RESCHEDULE" ? "Reschedule req." : "Cancel req."}</span>}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/bookings?${qs}&page=${p}`} aria-current={p === page ? "page" : undefined} className="inline-flex size-10 items-center justify-center border border-line bg-white text-sm aria-[current=page]:bg-ink aria-[current=page]:text-ivory">{p}</Link>
          ))}
        </nav>
      )}
    </>
  );
}
