import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Neon's free tier suspends the database after a few idle minutes and takes a
// few seconds to wake. Prisma's default 5s connect timeout makes the first
// request after a pause fail, so allow longer unless the URL already sets it.
function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw || !raw.startsWith("postgres")) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "20");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
    return url.toString();
  } catch {
    return undefined;
  }
}

export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;
