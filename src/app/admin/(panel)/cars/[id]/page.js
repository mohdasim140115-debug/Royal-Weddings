import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader, Panel } from "@/components/admin/ui";
import CarForm from "@/components/admin/CarForm";
import { ImageManager, AvailabilityManager } from "@/components/admin/CarMedia";
import Notice from "@/components/ui/Notice";
import { parseDay, todayInIndia } from "@/lib/format";

export const metadata = { title: "Edit car" };

export default async function EditCarPage({ params }) {
  const { id } = await params;
  const car = await prisma.car.findUnique({ where: { id }, include: { pricing: true, images: { orderBy: { sortOrder: "asc" } } } });
  if (!car) notFound();
  const [categories, blocks] = await Promise.all([
    prisma.carCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.carAvailability.findMany({ where: { carId: id, date: { gte: parseDay(todayInIndia()) } }, orderBy: { date: "asc" }, take: 60 }),
  ]);
  const refs = await prisma.booking.findMany({ where: { id: { in: blocks.map((b) => b.bookingId).filter(Boolean) } }, select: { id: true, reference: true } });
  const { pricing, images, ...rest } = car;

  return (
    <>
      <Link href="/admin/cars" className="inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> Cars
      </Link>
      <AdminHeader
        title={`${car.make} ${car.model}`}
        actions={
          <Link href={`/cars/${car.slug}`} target="_blank" className="inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
            View listing <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />
      {car.isDemo && <Notice className="mb-6">This is a sample listing with demo rates. Saving any change marks it as live data.</Notice>}
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <CarForm car={JSON.parse(JSON.stringify(rest))} pricing={pricing ? JSON.parse(JSON.stringify(pricing)) : null} categories={categories} />
        </div>
        <div className="space-y-6 xl:col-span-4">
          <Panel title="Photographs">
            <ImageManager carId={car.id} images={images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))} />
          </Panel>
          <Panel title="Availability">
            <AvailabilityManager carId={car.id} blocks={blocks.map((b) => ({ id: b.id, date: b.date.toISOString(), status: b.status, note: b.note, reference: refs.find((r) => r.id === b.bookingId)?.reference || null }))} />
          </Panel>
        </div>
      </div>
    </>
  );
}
