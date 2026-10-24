import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import EnquiryStatus from "@/components/admin/EnquiryStatus";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage({ searchParams }) {
  const { status } = await searchParams;
  const where = ["NEW", "CONTACTED", "CLOSED"].includes(status) ? { status } : {};
  const rows = await prisma.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { car: { select: { make: true, model: true } } } });

  return (
    <>
      <AdminHeader title="Enquiries" intro="Messages from the contact, car and photography forms." />
      <nav className="mb-4 flex gap-2 text-xs uppercase tracking-[0.14em]">
        {[["", "All"], ["NEW", "New"], ["CONTACTED", "Contacted"], ["CLOSED", "Closed"]].map(([v, l]) => (
          <a key={l} href={v ? `?status=${v}` : "?"} aria-current={(status || "") === v ? "page" : undefined} className="inline-flex min-h-10 items-center border border-line bg-white px-4 aria-[current=page]:bg-ink aria-[current=page]:text-ivory">{l}</a>
        ))}
      </nav>
      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id} className="border border-line bg-white p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <p className="font-display text-xl">{e.subject}</p>
                <p className="text-sm">
                  {e.name} · <a href={`tel:${e.phone}`} className="underline underline-offset-4">{e.phone}</a>
                  {e.email && <> · <a href={`mailto:${e.email}`} className="underline underline-offset-4">{e.email}</a></>}
                </p>
                <p className="text-xs text-stone">
                  {formatDateTime(e.createdAt)} · via {e.source}
                  {e.car && ` · ${e.car.make} ${e.car.model}`}
                  {e.eventDate && ` · event ${formatDate(e.eventDate)}`}
                </p>
              </div>
              <EnquiryStatus id={e.id} status={e.status} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-charcoal">{e.message}</p>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-stone">No enquiries.</li>}
      </ul>
    </>
  );
}
