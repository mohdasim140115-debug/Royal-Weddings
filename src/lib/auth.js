import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db.js";
import { HttpError } from "./http.js";

const COOKIE = "rw_session";
const SESSION_DAYS = 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. See .env.example.");
  }
  return s;
}

export { hashPassword, verifyPassword } from "./password.js";

// ── Signed tokens ────────────────────────────────────────────
function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function createToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!safeEqual(sig, sign(body))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

/** Unguessable per-booking token so guests can view their own booking. */
export function bookingAccessToken(reference) {
  return sign(`booking:${reference}`).slice(0, 32);
}

export function verifyBookingAccessToken(reference, token) {
  return typeof token === "string" && safeEqual(token, bookingAccessToken(reference));
}

// ── Sessions ─────────────────────────────────────────────────
export async function startSession(user) {
  const token = createToken({ uid: user.id, role: user.role, exp: Date.now() + SESSION_DAYS * 86400_000 });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Current user loaded fresh from the database (role changes take effect immediately). */
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const data = readToken(jar.get(COOKIE)?.value);
  if (!data) return null;
  const user = await prisma.user.findUnique({
    where: { id: data.uid },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  });
  return user && user.isActive ? user : null;
});

export const isStaff = (user) => user && (user.role === "ADMIN" || user.role === "STAFF");

/** For admin pages: redirects to the admin login when not authorised. */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!isStaff(user)) redirect("/admin/login");
  return user;
}

/** For admin API routes: throws 401/403. */
export async function requireAdminApi({ adminOnly = false } = {}) {
  const user = await getCurrentUser();
  if (!user) throw new HttpError("Please sign in.", 401);
  if (!isStaff(user) || (adminOnly && user.role !== "ADMIN")) throw new HttpError("You do not have access to this action.", 403);
  return user;
}

export async function requireCustomerPage(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return user;
}
