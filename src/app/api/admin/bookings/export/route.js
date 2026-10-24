import { prisma } from "@/lib/db";
import { handler } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { bookingWhere } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

const esc = (v) => {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection and quote CSV fields.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const GET = handler(async (request) => {
  const user = await requireAdminApi({ adminOnly: true });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const rows = await prisma.booking.findMany({ where: bookingWhere(sp), orderBy: { eventDate: "asc" }, take: 5000 });
  const header = ["Reference", "Status", "Service", "Event type", "Event date", "Customer", "Phone", "Email", "Total", "Paid", "Balance", "Quote required", "Created"];
  const lines = rows.map((b) =>
    [b.reference, b.status, b.serviceType, b.eventType, b.eventDate.toISOString().slice(0, 10), b.customerName, b.phone, b.email, b.total, b.amountPaid, b.total - b.amountPaid, b.quoteRequired ? "yes" : "no", b.createdAt.toISOString()]
      .map(esc)
      .join(",")
  );
  await audit(user.id, "EXPORT", "Booking", null, { count: rows.length, filters: sp });
  return new Response([header.map(esc).join(","), ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
});
