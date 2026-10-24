import "server-only";
import { prisma } from "./db.js";
import { business } from "@/config/site";

/** Display label: "Village, City" for villages, the name for cities. */
export function placeLabel(p) {
  return p.kind === "VILLAGE" && p.parentCity ? `${p.city}, ${p.parentCity}` : p.city;
}

/** How Google should find the place: exact coordinates when set, otherwise a full address. */
export function placeWaypoint(p) {
  if (p.latitude != null && p.longitude != null) {
    return { location: { latLng: { latitude: p.latitude, longitude: p.longitude } } };
  }
  const parts = [p.city, p.kind === "VILLAGE" ? p.parentCity : null, p.region || business.placesRegion, "India"];
  return { address: parts.filter(Boolean).join(", ") };
}

/** Active places for the public pickup/venue pickers (no internal fields). */
export async function listPublicPlaces() {
  const rows = await prisma.serviceLocation.findMany({
    where: { isActive: true },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { city: "asc" }],
    select: { id: true, city: true, kind: true, parentCity: true },
  });
  return rows.map((r) => ({ id: r.id, name: r.city, kind: r.kind, parentCity: r.parentCity, label: placeLabel(r) }));
}

export async function findActivePlaces(ids) {
  const wanted = ids.filter(Boolean);
  if (!wanted.length) return new Map();
  const rows = await prisma.serviceLocation.findMany({ where: { id: { in: wanted }, isActive: true } });
  return new Map(rows.map((r) => [r.id, r]));
}

export async function listGarages() {
  const rows = await prisma.serviceLocation.findMany({ where: { isActive: true, isBase: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({ name: r.city, waypoint: placeWaypoint(r) }));
}
