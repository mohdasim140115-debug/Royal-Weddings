import "server-only";
import { prisma } from "./db.js";
import { carCardInclude } from "./queries.js";
import { parseDay } from "./format.js";

export const PAGE_SIZE = 9;

export const BUDGETS = [
  { value: "under-10k", label: "Under ₹10,000", test: (p) => p < 10000 },
  { value: "10k-25k", label: "₹10,000 – ₹25,000", test: (p) => p >= 10000 && p <= 25000 },
  { value: "25k-plus", label: "Above ₹25,000", test: (p) => p > 25000 },
];

export const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest listings" },
];

/**
 * Comparable "starting price" for sorting and budget filters: the smallest
 * amount the published rule can produce for a short local booking.
 */
export function startingPrice(p) {
  if (!p) return Number.POSITIVE_INFINITY;
  const perKmMin = p.extraKmRate * Math.max(p.minimumKm, 0);
  const hourlyMin = p.extraHourRate * Math.max(p.minimumHours, 0);
  const base = p.baseFare || perKmMin + (p.baseFare ? 0 : hourlyMin);
  return Math.max(base, p.minimumFare || 0);
}

function one(v) {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(sp = {}) {
  const f = {
    q: (one(sp.q) || "").toString().trim().slice(0, 60),
    category: one(sp.category) || "",
    make: one(sp.make) || "",
    level: one(sp.level) || "",
    seats: Number(one(sp.seats)) || 0,
    budget: one(sp.budget) || "",
    decorated: one(sp.decorated) === "1",
    chauffeur: one(sp.chauffeur) === "1",
    date: one(sp.date) || "",
    hideReserved: one(sp.available) === "1",
    sort: SORTS.some((s) => s.value === one(sp.sort)) ? one(sp.sort) : "popular",
    view: one(sp.view) === "list" ? "list" : "grid",
    page: Math.max(1, Math.floor(Number(one(sp.page)) || 1)),
  };
  if (!parseDay(f.date)) f.date = "";
  return f;
}

export async function searchCars(f) {
  const where = { isActive: true };
  if (f.category) where.category = { slug: f.category };
  if (f.make) where.make = f.make;
  if (f.level === "luxury") where.luxuryLevel = { in: ["luxury", "ultra"] };
  else if (f.level) where.luxuryLevel = f.level;
  if (f.seats) where.seats = { gte: f.seats };
  if (f.decorated) where.decorationAvailable = true;
  if (f.chauffeur) where.chauffeurAvailable = true;

  const orderBy = f.sort === "newest" ? { createdAt: "desc" } : { popularity: "desc" };
  let cars = await prisma.car.findMany({ where, include: carCardInclude, orderBy });

  // Case-insensitive make/model search, identical on SQLite and PostgreSQL.
  // (The fleet is small; move this into the query if it grows to thousands.)
  if (f.q) {
    const needle = f.q.toLowerCase();
    cars = cars.filter((c) => `${c.make} ${c.model} ${c.variant || ""}`.toLowerCase().includes(needle));
  }

  const budget = BUDGETS.find((b) => b.value === f.budget);
  if (budget) cars = cars.filter((c) => budget.test(startingPrice(c.pricing)));

  if (f.sort === "price-asc") cars.sort((a, b) => startingPrice(a.pricing) - startingPrice(b.pricing));
  if (f.sort === "price-desc") cars.sort((a, b) => startingPrice(b.pricing) - startingPrice(a.pricing));

  // Availability: only real blocks are shown. Absence of a block is NOT
  // presented as "available" — it is "confirmed on request".
  let reserved = new Set();
  const day = parseDay(f.date);
  if (day) {
    const blocks = await prisma.carAvailability.findMany({ where: { date: day, carId: { in: cars.map((c) => c.id) } }, select: { carId: true } });
    reserved = new Set(blocks.map((b) => b.carId));
    if (f.hideReserved) cars = cars.filter((c) => !reserved.has(c.id));
  }

  const total = cars.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  return { cars: cars.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, pages, page, reserved };
}

export async function getFilterOptions() {
  const [categories, makes] = await Promise.all([
    prisma.carCategory.findMany({ orderBy: { sortOrder: "asc" }, where: { cars: { some: { isActive: true } } } }),
    prisma.car.findMany({ where: { isActive: true }, distinct: ["make"], select: { make: true }, orderBy: { make: "asc" } }),
  ]);
  return { categories, makes: makes.map((m) => m.make) };
}
