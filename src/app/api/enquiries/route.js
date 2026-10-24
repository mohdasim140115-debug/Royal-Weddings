import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { clean, isEmail, isPhone, normalizePhone } from "@/lib/validation";
import { parseDay } from "@/lib/format";

export const dynamic = "force-dynamic";

const SOURCES = ["contact", "car", "photography", "quote"];

export const POST = handler(async (request) => {
  limitOrThrow(request, "enquiry", { limit: 5, windowMs: 10 * 60_000 });
  const body = await readJson(request);
  if (body.website) return json({ ok: true }); // honeypot

  const fields = {};
  const name = clean(body.name, 120);
  const phone = normalizePhone(clean(body.phone, 20));
  const email = clean(body.email, 160).toLowerCase();
  const subject = clean(body.subject, 160) || "General enquiry";
  const message = clean(body.message, 3000);
  if (name.length < 2) fields.name = "Please enter your name.";
  if (!isPhone(phone)) fields.phone = "Enter a valid mobile number.";
  if (email && !isEmail(email)) fields.email = "Enter a valid email address.";
  if (message.length < 10) fields.message = "Please tell us a little more.";
  if (Object.keys(fields).length) return error("Please check the highlighted fields.", 422, { fields });

  let carId = null;
  if (body.carSlug) {
    const car = await prisma.car.findUnique({ where: { slug: clean(body.carSlug, 120) }, select: { id: true } });
    carId = car?.id || null;
  }

  await prisma.enquiry.create({
    data: {
      name, phone, email: email || null, subject, message, carId,
      eventDate: parseDay(body.eventDate),
      source: SOURCES.includes(body.source) ? body.source : "contact",
    },
  });
  return json({ ok: true }, 201);
});
