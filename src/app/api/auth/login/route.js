import { prisma } from "@/lib/db";
import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { verifyPassword, startSession, isStaff } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clean } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// A valid hash used when the email is unknown, so response time does not
// reveal which emails have accounts.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export const POST = handler(async (request) => {
  limitOrThrow(request, "login", { limit: 10, windowMs: 10 * 60_000 });
  const body = await readJson(request);
  const email = clean(body.email, 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return error("Enter your email and password.", 422);
  if (!rateLimit(`login-email:${email}`, { limit: 8, windowMs: 15 * 60_000 }).ok) {
    return error("Too many attempts for this account. Please wait 15 minutes.", 429);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = verifyPassword(password, user?.passwordHash || DUMMY_HASH) && user?.isActive;
  if (!valid) return error("Incorrect email or password.", 401);
  if (body.scope === "admin" && !isStaff(user)) return error("This account does not have admin access.", 403);

  await startSession(user);
  if (isStaff(user)) await audit(user.id, "LOGIN", "User", user.id);
  return json({ ok: true, role: user.role });
});
