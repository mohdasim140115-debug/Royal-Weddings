import "server-only";

// Google Maps Routes API (computeRoutes) — server-side only.
// Returns real driving distance/duration. Never falls back to straight-line
// distance: if the provider is unavailable the caller must switch to the
// clearly-labelled manual mode.

const ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK = [
  "routes.distanceMeters",
  "routes.duration",
  "routes.legs.distanceMeters",
  "routes.legs.duration",
  "routes.travelAdvisory.tollInfo",
].join(",");

const cache = new Map();
const TTL = 15 * 60_000;

export class RouteError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function mapsConfigured() {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY);
}

const seconds = (d) => (typeof d === "string" ? Number(d.replace("s", "")) || 0 : 0);

async function callRoutes(body) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/** A stop is an address string or a waypoint object ({ address } or { location: { latLng } }). */
const toWaypoint = (stop) => (typeof stop === "string" ? { address: stop } : stop);
const keyOf = (stop) => (typeof stop === "string" ? stop.toLowerCase() : JSON.stringify(stop));

/**
 * @param {{ pickup: string|object, venue: string|object, stops?: Array<string|object>, roundTrip?: boolean }} input
 * @returns {Promise<{ oneWayKm, totalKm, oneWayMinutes, totalMinutes, legs, tollEstimate, roundTrip, provider }>}
 */
export async function computeDrivingRoute({ pickup, venue, stops = [], roundTrip = false }) {
  if (!mapsConfigured()) throw new RouteError("NOT_CONFIGURED", "Live route calculation is not configured.");

  const key = JSON.stringify([keyOf(pickup), keyOf(venue), stops.map(keyOf), roundTrip]);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const intermediates = [...stops, ...(roundTrip ? [venue] : [])].map(toWaypoint);
  const body = {
    origin: toWaypoint(pickup),
    destination: toWaypoint(roundTrip ? pickup : venue),
    intermediates,
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
    regionCode: "IN",
    languageCode: "en-IN",
    units: "METRIC",
    extraComputations: ["TOLLS"],
  };

  let res, data;
  try {
    ({ res, data } = await callRoutes(body));
    if (res.status === 400 && JSON.stringify(data).includes("extraComputations")) {
      delete body.extraComputations;
      ({ res, data } = await callRoutes(body));
    }
  } catch (e) {
    console.error("[maps] request failed", e?.name || e);
    throw new RouteError("PROVIDER_UNAVAILABLE", "The routing service did not respond. Please try again or request a manual quote.");
  }

  if (res.status === 400) {
    throw new RouteError("ADDRESS_NOT_FOUND", "We couldn't locate one of these addresses. Try adding the area, city and PIN code.");
  }
  if (res.status === 401 || res.status === 403) {
    console.error("[maps] key rejected", data?.error?.message);
    throw new RouteError("PROVIDER_REJECTED", "Live route calculation is temporarily unavailable. You can still request a quote.");
  }
  if (!res.ok) {
    console.error("[maps] error", res.status, data?.error?.message);
    throw new RouteError("PROVIDER_UNAVAILABLE", "The routing service returned an error. Please try again shortly.");
  }

  const route = data.routes?.[0];
  if (!route || !route.distanceMeters) {
    throw new RouteError("NO_ROUTE", "No driving route was found between these addresses.");
  }

  const legs = (route.legs || []).map((l) => ({ km: (l.distanceMeters || 0) / 1000, minutes: seconds(l.duration) / 60 }));
  const outboundLegCount = stops.length + 1;
  const outbound = legs.slice(0, outboundLegCount);
  const oneWayKm = outbound.reduce((s, l) => s + l.km, 0);
  const oneWayMinutes = outbound.reduce((s, l) => s + l.minutes, 0);

  let tollEstimate = 0;
  const prices = route.travelAdvisory?.tollInfo?.estimatedPrice;
  if (Array.isArray(prices)) {
    const inr = prices.find((p) => p.currencyCode === "INR");
    if (inr) tollEstimate = Math.round(Number(inr.units || 0) + Number(inr.nanos || 0) / 1e9);
  }

  const value = {
    provider: "google-routes",
    roundTrip,
    oneWayKm: Math.round(oneWayKm * 10) / 10,
    totalKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
    oneWayMinutes: Math.round(oneWayMinutes),
    totalMinutes: Math.round(seconds(route.duration) / 60),
    legs,
    tollEstimate,
  };

  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return value;
}

const MATRIX_ENDPOINT = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

/**
 * Picks the garage that minimises (garage → start) + (end → garage) using one
 * Route Matrix call. Distances are real road distances; the return leg uses
 * the garage → end distance, which is the same road in reverse.
 * @param {Array<{ name: string, waypoint: object }>} bases
 * @returns {Promise<{ base: string, toStartKm, fromEndKm, km, minutes } | null>}
 */
export async function nearestGarageLegs(bases, start, end) {
  if (!mapsConfigured() || bases.length === 0) return null;
  const key = JSON.stringify(["garage", bases.map((b) => b.name), keyOf(start), keyOf(end)]);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  let rows;
  try {
    const res = await fetch(MATRIX_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,condition",
      },
      body: JSON.stringify({
        origins: bases.map((b) => ({ waypoint: b.waypoint })),
        destinations: [{ waypoint: toWaypoint(start) }, { waypoint: toWaypoint(end) }],
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        regionCode: "IN",
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    rows = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(rows)) {
      console.error("[maps] matrix error", res.status, rows?.error?.message);
      throw new RouteError("PROVIDER_UNAVAILABLE", "Garage distance could not be calculated.");
    }
  } catch (e) {
    if (e instanceof RouteError) throw e;
    console.error("[maps] matrix request failed", e?.name || e);
    throw new RouteError("PROVIDER_UNAVAILABLE", "Garage distance could not be calculated.");
  }

  const cell = (o, d) => rows.find((r) => r.originIndex === o && (r.destinationIndex ?? 0) === d && r.condition === "ROUTE_EXISTS");
  let best = null;
  bases.forEach((b, i) => {
    const a = cell(i, 0);
    const z = cell(i, 1);
    if (!a || !z) return;
    const km = ((a.distanceMeters || 0) + (z.distanceMeters || 0)) / 1000;
    if (!best || km < best.km) {
      best = {
        base: b.name,
        toStartKm: Math.round(((a.distanceMeters || 0) / 1000) * 10) / 10,
        fromEndKm: Math.round(((z.distanceMeters || 0) / 1000) * 10) / 10,
        km: Math.round(km * 10) / 10,
        minutes: Math.round((seconds(a.duration) + seconds(z.duration)) / 60),
      };
    }
  });
  if (!best) throw new RouteError("NO_ROUTE", "No road route was found from our garages.");
  cache.set(key, { at: Date.now(), value: best });
  return best;
}
