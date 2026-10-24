import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { hashPassword, startSession } from "@/lib/auth";
import { clean, isEmail, isPhone, normalizePhone, validatePassword } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  limitOrThrow(request, "register", { limit: 5, windowMs: 60 * 60_000 });
  const body = await readJson(request);
  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = normalizePhone(clean(body.phone, 20));
  const fields = {};
  if (name.length < 2) fields.name = "Please enter your name.";
  if (!isEmail(email)) fields.email = "Enter a valid email address.";
  if (phone && !isPhone(phone)) fields.phone = "Enter a valid mobile number.";
  const pwError = validatePassword(body.password);
  if (pwError) fields.password = pwError;
  if (Object.keys(fields).length) return error("Please check the highlighted fields.", 422, { fields });

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return error("An account with this email already exists. Please sign in.", 409, { fields: { email: "Already registered." } });

  // Customers only — staff/admin accounts are created by administrators.
  const user = await prisma.user.create({ data: { name, email, phone: phone || null, role: "CUSTOMER", passwordHash: hashPassword(body.password) } });
  await startSession(user);
  return json({ ok: true }, 201);
});
