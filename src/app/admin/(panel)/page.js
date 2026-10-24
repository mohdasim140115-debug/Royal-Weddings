import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminHeader, StatCard, Panel, Table } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import { formatINR, formatDate, formatDateTime, STATUS_LABELS, SERVICE_LABELS, parseDay, todayInIndia } from "@/lib/format";
import { mapsConfigured } from "@/lib/maps";
import { razorpayConfigured } from "@/lib/razorpay";
import { channels } from "@/lib/notify";

export const metadata = { title: "Dashboard" };

const TONE = { PENDING: "gold", CONFIRMED: "success", COMPLETED: "dark", CANCELLED: "danger" };

export default async function AdminDashboard() {
  const today = parseDay(todayInIndia());
  const in60 = new Date(today);
  in60.setUTCDate(in60.getUTCDate() + 60);

  const [byStatus, byService, payments, upcoming, enquiries, requests] = await Promise.all([
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.booking.groupBy({ by: ["serviceType"], _count: true, where: { status: { not: "CANCELLED" } } }),
    // Revenue = verified payments only (gateway-verified or staff-recorded), net of refunds.
    prisma.payment.findMany({ where: { status: { in: ["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"] } }, select: { amount: true, refundedAmount: true } }),
    prisma.booking.findMany({ where: { status: { in: ["PENDING", "CONFIRMED"] }, eventDate: { gte: today, lte: in60 } }, orderBy: { eventDate: "asc" }, take: 10 }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.booking.count({ where: { customerRequest: { not: null } } }),
  ]);

  const count = (s) => byStatus.find((x) => x.status === s)?._count || 0;
  const svc = (s) => byService.find((x) => x.serviceType === s)?._count || 0;
  const total = byStatus.reduce((n, x) => n + x._count, 0);
  const revenue = payments.reduce((n, p) => n + p.amount - p.refundedAmount, 0);

  const integrations = [
    ["Google Maps routing", mapsConfigured()],
    ["Razorpay payments", razorpayConfigured()],
    ["Email notifications", channels.email()],
    ["WhatsApp notifications", channels.whatsapp()],
  ];

  return (
    <>
      <AdminHeader title="Dashboard" intro="Overview of requests, confirmed work and verified revenue." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total requests" value={total} href="/admin/bookings" />
        <StatCard label="Pending" value={count("PENDING")} href="/admin/bookings?status=PENDING" hint={requests ? `${requests} change request(s)` : undefined} />
        <StatCard label="Confirmed" value={count("CONFIRMED")} href="/admin/bookings?status=CONFIRMED" />
        <StatCard label="Verified revenue" value={formatINR(revenue)} hint="Recorded payments, net of refunds" />
        <StatCard label="Completed" value={count("COMPLETED")} href="/admin/bookings?status=COMPLETED" />
        <StatCard label="Cancelled" value={count("CANCELLED")} href="/admin/bookings?status=CANCELLED" />
        <StatCard label="Car bookings" value={svc("CAR")} href="/admin/bookings?service=CAR" />
        <StatCard label="Photo / video" value={svc("PHOTOGRAPHY") + svc("VIDEOGRAPHY")} hint={`Combined packages: ${svc("COMBINED")}`} href="/admin/bookings?service=PHOTOGRAPHY" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Panel title="Upcoming events" className="xl:col-span-2" action={<Link href="/admin/bookings" className="text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">All bookings</Link>}>
          <Table head={["Date", "Reference", "Customer", "Service", "Status"]} empty={!upcoming.length && <p className="py-6 text-sm text-stone">No events in the next 60 days.</p>}>
            {upcoming.map((b) => (
              <tr key={b.id}>
                <td className="px-3 py-3 whitespace-nowrap">{formatDate(b.eventDate, { day: "numeric", month: "short" })}</td>
                <td className="px-3 py-3"><Link href={`/admin/bookings/${b.id}`} className="font-medium underline decoration-champagne underline-offset-4">{b.reference}</Link></td>
                <td className="px-3 py-3">{b.customerName}</td>
                <td className="px-3 py-3">{SERVICE_LABELS[b.serviceType]}</td>
                <td className="px-3 py-3"><Badge tone={TONE[b.status]}>{STATUS_LABELS[b.status]}</Badge></td>
              </tr>
            ))}
          </Table>
        </Panel>

        <div className="space-y-6">
          <Panel title="Recent enquiries" action={<Link href="/admin/enquiries" className="text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">All</Link>}>
            {enquiries.length === 0 ? (
              <p className="text-sm text-stone">No enquiries yet.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {enquiries.map((e) => (
                  <li key={e.id} className="py-3">
                    <p className="flex justify-between gap-2"><span className="font-medium">{e.name}</span>{e.status === "NEW" && <Badge tone="gold">New</Badge>}</p>
                    <p className="truncate text-stone">{e.subject}</p>
                    <p className="text-xs text-stone">{formatDateTime(e.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Integrations">
            <ul className="space-y-2 text-sm">
              {integrations.map(([name, on]) => (
                <li key={name} className="flex items-center justify-between">
                  {name}
                  <Badge tone={on ? "success" : "neutral"}>{on ? "Active" : "Not configured"}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone">Configure keys in your environment variables — see README.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
