import { prisma } from "@/lib/db";
import { notifyBooking } from "@/lib/notify";
import { json, error } from "@/lib/http";
import { business } from "@/config/site";
import { parseDay, todayInIndia } from "@/lib/format";

export const dynamic = "force-dynamic";

// Sends "upcoming event" reminders for confirmed bookings N days ahead.
// Schedule daily (system cron, Vercel Cron, etc.) with the header:
//   Authorization: Bearer <CRON_SECRET>
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return error("Unauthorised.", 401);

  const target = parseDay(todayInIndia());
  target.setUTCDate(target.getUTCDate() + business.reminderDaysBefore);

  const bookings = await prisma.booking.findMany({ where: { status: "CONFIRMED", eventDate: target } });
  let sent = 0;
  for (const b of bookings) {
    const already = await prisma.notificationLog.findFirst({ where: { bookingId: b.id, template: "EVENT_REMINDER" } });
    if (already) continue;
    await notifyBooking("EVENT_REMINDER", b);
    sent++;
  }
  return json({ ok: true, date: target.toISOString().slice(0, 10), considered: bookings.length, sent });
}
