import { prisma } from "@/lib/db";
import { handler, json, error, readJson } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { parseDay } from "@/lib/format";
import { clean } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Manually block or unblock a car for a date (maintenance, offline bookings).
// Dates held by confirmed bookings cannot be released here — cancel or
// reschedule the booking instead.
export const POST = handler(async (request, { params }) => {
  const user = await requireAdminApi();
  const { id } = await params;
  const body = await readJson(request);
  const day = parseDay(body.date);
  if (!day) return error("Choose a valid date.", 422);
  const car = await prisma.car.findUnique({ where: { id }, select: { id: true } });
  if (!car) return error("Car not found.", 404);

  if (body.action === "block") {
    try {
      await prisma.carAvailability.create({ data: { carId: id, date: day, status: "BLOCKED", note: clean(body.note, 200) || null } });
    } catch (e) {
      if (e?.code === "P2002") return error("This date is already blocked or booked.", 409);
      throw e;
    }
  } else if (body.action === "unblock") {
    const row = await prisma.carAvailability.findUnique({ where: { carId_date: { carId: id, date: day } } });
    if (!row) return error("No block on this date.", 404);
    if (row.status === "BOOKED") return error("This date is held by a confirmed booking. Cancel or reschedule that booking instead.", 409);
    await prisma.carAvailability.delete({ where: { id: row.id } });
  } else {
    return error("Unknown action.", 422);
  }

  await audit(user.id, `AVAILABILITY_${body.action.toUpperCase()}`, "car", id, { date: body.date });
  return json({ ok: true });
});
