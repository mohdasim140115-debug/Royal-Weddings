import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pricingSummary } from "@/lib/car-display";
import { mapsConfigured } from "@/lib/maps";

export const dynamic = "force-dynamic";

/** Public car list for the quick "Book Now" modal (no internal fields). */
export async function GET() {
  const cars = await prisma.car.findMany({
    where: { isActive: true, pricing: { isNot: null } },
    orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }],
    select: {
      slug: true, make: true, model: true, seats: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      pricing: true,
    },
  });
  const list = cars.map((c) => {
    const price = pricingSummary(c.pricing);
    return { slug: c.slug, make: c.make, model: c.model, seats: c.seats, image: c.images[0] || null, from: price.headline, fromNote: price.sub };
  });
  return NextResponse.json({ cars: list, mapsLive: mapsConfigured() }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
