import { prisma } from "@/lib/db";
import { handler, json, error, limitOrThrow } from "@/lib/http";
import { parseDay } from "@/lib/format";

export const dynamic = "force-dynamic";

// Returns only whether a reservation/block is recorded. Absence of a block
// is deliberately NOT reported as "available".
export const GET = handler(async (request, { params }) => {
  limitOrThrow(request, "availability", { limit: 60 });
  const { slug } = await params;
  const day = parseDay(new URL(request.url).searchParams.get("date"));
  if (!day) return error("Please provide a valid date (YYYY-MM-DD).", 400);
  const car = await prisma.car.findFirst({ where: { slug, isActive: true }, select: { id: true } });
  if (!car) return error("Car not found.", 404);
  const block = await prisma.carAvailability.findUnique({ where: { carId_date: { carId: car.id, date: day } } });
  return json({ reserved: Boolean(block), confirmedOnRequest: true });
});
