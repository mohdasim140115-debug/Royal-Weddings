import Link from "next/link";
import Image from "next/image";
import { Plus, Car } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader, Table, darkBtn } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import { pricingSummary } from "@/lib/car-display";

export const metadata = { title: "Cars" };

export default async function AdminCarsPage() {
  const cars = await prisma.car.findMany({
    include: { category: true, pricing: true, images: { take: 1, orderBy: { sortOrder: "asc" } }, _count: { select: { availability: true } } },
    orderBy: [{ isActive: "desc" }, { make: "asc" }],
  });
  return (
    <>
      <AdminHeader title="Cars & availability" intro="Listings, rates, photographs and blocked dates." actions={<Link href="/admin/cars/new" className={darkBtn}><Plus className="size-4" aria-hidden="true" /> Add a car</Link>} />
      <div className="border border-line bg-white">
        <Table head={["", "Car", "Category", "Seats", "Pricing", "Status"]}>
          {cars.map((c) => {
            const p = pricingSummary(c.pricing);
            return (
              <tr key={c.id} className="hover:bg-sand/50">
                <td className="w-20 px-3 py-2">
                  <div className="relative h-12 w-16 overflow-hidden bg-sand">
                    {c.images[0] ? <Image src={c.images[0].url} alt="" fill sizes="64px" className="object-cover" /> : <Car className="m-auto mt-3 size-5 text-stone" />}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/cars/${c.id}`} className="font-medium underline decoration-champagne underline-offset-4">{c.make} {c.model}</Link>
                  <span className="block text-xs text-stone">/{c.slug}</span>
                </td>
                <td className="px-3 py-2">{c.category.name}</td>
                <td className="px-3 py-2">{c.seats}</td>
                <td className="px-3 py-2">{p.headline}<span className="block text-xs text-stone">{p.sub}</span></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Listed" : "Hidden"}</Badge>
                    {c.isFeatured && <Badge tone="gold">Featured</Badge>}
                    {c.isDemo && <Badge tone="burgundy">Sample</Badge>}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
    </>
  );
}
