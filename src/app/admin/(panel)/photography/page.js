import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";

export const metadata = { title: "Photography & crew" };

export default async function AdminPhotographyPage() {
  const [packages, portfolio, vendors, upcoming] = await Promise.all([
    prisma.photoPackage.count(),
    prisma.portfolioItem.count(),
    prisma.vendor.count(),
    prisma.booking.count({ where: { status: "CONFIRMED", serviceType: { in: ["PHOTOGRAPHY", "VIDEOGRAPHY", "COMBINED"] }, eventDate: { gte: new Date() } } }),
  ]);
  const cards = [
    ["/admin/catalog/photo-packages", "Packages & pricing", `${packages} packages — crew, hours, deliverables, extra-hour and extra-day rates`],
    ["/admin/catalog/portfolio", "Portfolio", `${portfolio} items shown on the photography page`],
    ["/admin/catalog/vendors", "Photographers, videographers & vendors", `${vendors} vendors — crew capacity per date is enforced when confirming bookings`],
    ["/admin/bookings?service=PHOTOGRAPHY", "Photography bookings", `${upcoming} confirmed upcoming photo/film bookings`],
  ];
  return (
    <>
      <AdminHeader title="Photography & crew" intro="Manage packages, portfolio and the crew who deliver them." />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(([href, title, body]) => (
          <Link key={href} href={href} className="border border-line bg-white p-6 transition-colors hover:border-ink">
            <p className="font-display text-2xl">{title}</p>
            <p className="mt-1 text-sm text-stone">{body}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
