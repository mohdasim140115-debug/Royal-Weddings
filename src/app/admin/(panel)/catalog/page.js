import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import { CATALOGS } from "@/config/admin-catalog";
import { business } from "@/config/site";

export const metadata = { title: "Catalogue & pricing" };

const ORDER = ["decorations", "addons", "wedding-packages", "coupons", "reviews", "locations", "categories"];

export default async function CatalogIndex() {
  const counts = await Promise.all(ORDER.map((t) => prisma[CATALOGS[t].model].count()));
  return (
    <>
      <AdminHeader title="Catalogue & pricing" intro="Everything customers can select, and the rules that price it." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ORDER.map((t, i) => (
          <Link key={t} href={`/admin/catalog/${t}`} className="border border-line bg-white p-5 transition-colors hover:border-ink">
            <p className="font-display text-2xl">{CATALOGS[t].title}</p>
            <p className="mt-1 text-sm text-stone">{counts[i]} item{counts[i] === 1 ? "" : "s"}</p>
          </Link>
        ))}
        <Link href="/admin/cars" className="border border-line bg-white p-5 transition-colors hover:border-ink">
          <p className="font-display text-2xl">Vehicle rates</p>
          <p className="mt-1 text-sm text-stone">Edit per-car pricing rules in Cars</p>
        </Link>
      </div>
      <div className="mt-8 border border-line bg-white p-5 text-sm">
        <p className="font-semibold">Business-wide settings</p>
        <p className="mt-1 text-stone">
          Tax: {business.taxLabel} {business.taxRatePercent}% · Advance: {business.advancePercent}% (min ₹{business.minimumAdvance}) · Outstation threshold: {business.outstationThresholdKm} km. These are set in <code className="bg-sand px-1">src/config/site.js</code> — confirm them with your accountant.
        </p>
      </div>
    </>
  );
}
