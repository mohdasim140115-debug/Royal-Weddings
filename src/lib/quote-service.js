import "server-only";
import { prisma } from "./db.js";
import { business } from "@/config/site";
import { computeDrivingRoute, nearestGarageLegs, mapsConfigured, RouteError } from "./maps.js";
import { findActivePlaces, listGarages, placeLabel, placeWaypoint } from "./places.js";
import { computeVehicleCharges, computePhotoPackageCharges, computeAddOnCharge, computeQuote } from "./pricing.js";
import { clean, int, isDate, isTime, SERVICE_TYPES } from "./validation.js";
import { parseDay } from "./format.js";

const MANUAL_ASSUMED_SPEED_KMH = 30;

export class QuoteError extends Error {
  constructor(message, code = "INVALID", field = null) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

/** Normalises untrusted quote input into a safe, bounded shape. */
export function normaliseQuoteInput(raw = {}) {
  const trip = raw.trip || {};
  const serviceType = SERVICE_TYPES.includes(raw.serviceType) ? raw.serviceType : "CAR";
  return {
    serviceType,
    eventDate: isDate(raw.eventDate) ? raw.eventDate : null,
    trip: {
      pickup: clean(trip.pickup, 200),
      venue: clean(trip.venue, 200),
      pickupPlaceId: trip.pickupPlaceId ? clean(trip.pickupPlaceId, 40) : null,
      venuePlaceId: trip.venuePlaceId ? clean(trip.venuePlaceId, 40) : null,
      stops: (Array.isArray(trip.stops) ? trip.stops : []).map((s) => clean(s, 200)).filter(Boolean).slice(0, 3),
      tripType: trip.tripType === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY",
      pickupTime: isTime(trip.pickupTime) ? trip.pickupTime : null,
      waitingHours: Math.min(16, Math.max(0, Math.round((Number(trip.waitingHours) || 0) * 2) / 2)),
      passengers: int(trip.passengers, { min: 1, max: 20, fallback: 1 }),
      outstation: Boolean(trip.outstation),
      outstationDays: int(trip.outstationDays, { min: 1, max: 10, fallback: 1 }),
      manualKm: trip.manualKm === "" || trip.manualKm == null ? null : Math.min(5000, Math.max(0, Number(trip.manualKm) || 0)),
    },
    car: raw.car?.slug ? { slug: clean(raw.car.slug, 120), decorationSlug: raw.car.decorationSlug ? clean(raw.car.decorationSlug, 120) : null } : null,
    photo: (Array.isArray(raw.photo) ? raw.photo : [])
      .filter((p) => p?.slug)
      .slice(0, 4)
      .map((p) => ({ slug: clean(p.slug, 120), extraHours: int(p.extraHours, { max: 24 }), extraDays: int(p.extraDays, { max: 10 }) })),
    addOns: (Array.isArray(raw.addOns) ? raw.addOns : [])
      .filter((a) => a?.slug)
      .slice(0, 20)
      .map((a) => ({ slug: clean(a.slug, 120), quantity: int(a.quantity, { min: 1, max: 50, fallback: 1 }) })),
    weddingPackageSlug: raw.weddingPackageSlug ? clean(raw.weddingPackageSlug, 120) : null,
    couponCode: raw.couponCode ? clean(raw.couponCode, 40).toUpperCase() : null,
  };
}

/**
 * Builds an authoritative quote from normalised input.
 * Throws QuoteError for invalid selections; route problems are returned
 * as `routeError` so the UI can fall back to a manual quote request.
 */
export async function buildQuote(input, { requireRoute = false } = {}) {
  const sections = [];
  const notes = [];
  const atActuals = [];
  const lineItems = [];
  let quoteRequired = false;
  let route = null;
  let routeError = null;
  let distanceSource = "NONE";
  let car = null;

  const wantsCar = input.serviceType === "CAR" || (input.serviceType === "COMBINED" && input.car);
  const wantsPhoto = input.serviceType !== "CAR";

  if (input.serviceType === "CAR" && !input.car) throw new QuoteError("Please choose a car.", "MISSING_CAR", "car");
  if ((input.serviceType === "PHOTOGRAPHY" || input.serviceType === "VIDEOGRAPHY") && input.photo.length === 0) {
    throw new QuoteError("Please choose a photography or film package.", "MISSING_PACKAGE", "photo");
  }
  if (input.serviceType === "COMBINED" && !input.car && input.photo.length === 0) {
    throw new QuoteError("Add at least one service to your package.", "EMPTY", "services");
  }

  // ── Vehicle ────────────────────────────────────────────────
  if (wantsCar) {
    car = await prisma.car.findFirst({
      where: { slug: input.car.slug, isActive: true },
      include: { pricing: true, category: true },
    });
    if (!car || !car.pricing) throw new QuoteError("The selected car is not available for booking.", "CAR_NOT_FOUND", "car");
    if (input.trip.passengers > car.seats) {
      throw new QuoteError(`The ${car.make} ${car.model} seats up to ${car.seats} passengers.`, "TOO_MANY_PASSENGERS", "passengers");
    }

    const day = parseDay(input.eventDate);
    if (day) {
      const block = await prisma.carAvailability.findUnique({ where: { carId_date: { carId: car.id, date: day } } });
      if (block) {
        throw new QuoteError(
          `The ${car.make} ${car.model} is already reserved on this date. Please choose another car or date.`,
          "CAR_UNAVAILABLE",
          "eventDate"
        );
      }
    }

    const { pickup, venue, stops, tripType } = input.trip;
    if (!pickup || !venue) {
      if (requireRoute) throw new QuoteError("Enter both the pickup address and the venue.", "MISSING_ADDRESS", "pickup");
    } else if (mapsConfigured()) {
      // Places picked from the admin-managed list are looked up precisely;
      // anything typed freely is sent to Google as an address.
      const places = await findActivePlaces([input.trip.pickupPlaceId, input.trip.venuePlaceId]);
      const pickupPlace = places.get(input.trip.pickupPlaceId);
      const venuePlace = places.get(input.trip.venuePlaceId);
      const start = pickupPlace ? placeWaypoint(pickupPlace) : pickup;
      const end = venuePlace ? placeWaypoint(venuePlace) : venue;
      const roundTrip = tripType === "ROUND_TRIP";
      try {
        route = { ...(await computeDrivingRoute({ pickup: start, venue: end, stops, roundTrip })) };
        distanceSource = "LIVE_ROUTE";
        if (business.garageToGarage) {
          const garage = await nearestGarageLegs(await listGarages(), start, roundTrip ? start : end);
          if (garage) {
            route = {
              ...route,
              tripKm: route.totalKm,
              tripMinutes: route.totalMinutes,
              totalKm: Math.round((route.totalKm + garage.km) * 10) / 10,
              totalMinutes: route.totalMinutes + garage.minutes,
              garage,
            };
          }
        }
        if (pickupPlace) route.pickupLabel = placeLabel(pickupPlace);
        if (venuePlace) route.venueLabel = placeLabel(venuePlace);
      } catch (e) {
        if (!(e instanceof RouteError)) throw e;
        route = null;
        routeError = { code: e.code, message: e.message };
      }
    }

    if (!route && !mapsConfigured() && input.trip.manualKm > 0) {
      const km = input.trip.manualKm;
      route = {
        provider: "manual",
        roundTrip: tripType === "ROUND_TRIP",
        // Manual distance is entered as one-way; round trips double it.
        oneWayKm: km,
        totalKm: tripType === "ROUND_TRIP" ? km * 2 : km,
        oneWayMinutes: Math.round((km / MANUAL_ASSUMED_SPEED_KMH) * 60),
        totalMinutes: Math.round(((tripType === "ROUND_TRIP" ? km * 2 : km) / MANUAL_ASSUMED_SPEED_KMH) * 60),
        tollEstimate: 0,
      };
      distanceSource = "MANUAL";
      quoteRequired = true;
      notes.push(
        `Distance was entered manually and travel time assumed at ${MANUAL_ASSUMED_SPEED_KMH} km/h. We will verify the route before confirming.`
      );
    }

    if (route) {
      const outstation = input.trip.outstation || route.oneWayKm > business.outstationThresholdKm;
      if (outstation && !input.trip.outstation) notes.push(`Treated as outstation: one-way distance exceeds ${business.outstationThresholdKm} km.`);
      const vehicle = computeVehicleCharges(car.pricing, {
        totalKm: route.totalKm,
        oneWayKm: route.oneWayKm,
        driveMinutes: route.totalMinutes,
        waitingMinutes: input.trip.waitingHours * 60,
        pickupTime: input.trip.pickupTime,
        days: outstation ? input.trip.outstationDays : 1,
        outstation,
        tollEstimate: route.tollEstimate,
      });
      sections.push({ title: `${car.make} ${car.model}`, kind: "VEHICLE", lines: vehicle.lines });
      notes.push(...vehicle.notes);
      atActuals.push(...vehicle.atActuals);
      lineItems.push({ kind: "VEHICLE", label: `${car.make} ${car.model}`, description: `${route.totalKm} km · ${tripType === "ROUND_TRIP" ? "round trip" : "one way"}`, amount: vehicle.subtotal, refSlug: car.slug });
    } else {
      quoteRequired = true;
    }

    if (input.car.decorationSlug) {
      if (!car.decorationAvailable) throw new QuoteError("Decoration is not offered for this car.", "NO_DECORATION", "decoration");
      const deco = await prisma.decorationPackage.findFirst({ where: { slug: input.car.decorationSlug, isActive: true } });
      if (!deco) throw new QuoteError("The selected decoration is no longer available.", "DECORATION_NOT_FOUND", "decoration");
      sections.push({ title: "Car decoration", kind: "DECORATION", lines: [{ key: `deco-${deco.slug}`, label: deco.name, amount: deco.price, taxable: true }] });
      lineItems.push({ kind: "DECORATION", label: deco.name, amount: deco.price, refSlug: deco.slug });
    }
  }

  // ── Photography / films ────────────────────────────────────
  if (wantsPhoto && input.photo.length) {
    const pkgs = await prisma.photoPackage.findMany({ where: { slug: { in: input.photo.map((p) => p.slug) }, isActive: true } });
    for (const sel of input.photo) {
      const pkg = pkgs.find((p) => p.slug === sel.slug);
      if (!pkg) throw new QuoteError("One of the selected packages is no longer available.", "PACKAGE_NOT_FOUND", "photo");
      const r = computePhotoPackageCharges(pkg, sel);
      if (r.quoteOnly) {
        quoteRequired = true;
        sections.push({ title: pkg.name, kind: "PHOTO_PACKAGE", quoteOnly: true, lines: [] });
        lineItems.push({ kind: "PHOTO_PACKAGE", label: pkg.name, description: "Price on request", amount: 0, refSlug: pkg.slug });
      } else {
        sections.push({ title: pkg.name, kind: "PHOTO_PACKAGE", lines: r.lines });
        lineItems.push({ kind: "PHOTO_PACKAGE", label: pkg.name, description: pkg.tier, amount: r.subtotal, refSlug: pkg.slug });
      }
    }
  }

  // ── Add-ons ────────────────────────────────────────────────
  if (input.addOns.length) {
    const addons = await prisma.addOnService.findMany({ where: { slug: { in: input.addOns.map((a) => a.slug) }, isActive: true } });
    const lines = [];
    for (const sel of input.addOns) {
      const a = addons.find((x) => x.slug === sel.slug);
      if (!a) continue;
      const line = computeAddOnCharge(a, sel.quantity);
      lines.push(line);
      lineItems.push({ kind: "ADDON", label: a.name, quantity: line.quantity, amount: line.amount, refSlug: a.slug });
    }
    if (lines.length) sections.push({ title: "Additional services", kind: "ADDON", lines });
  }

  // ── Discounts ──────────────────────────────────────────────
  let bundleDiscountPercent = 0;
  let weddingPackage = null;
  if (input.weddingPackageSlug && input.serviceType === "COMBINED") {
    weddingPackage = await prisma.weddingPackage.findFirst({ where: { slug: input.weddingPackageSlug, isActive: true } });
    if (weddingPackage?.bundleDiscountPercent > 0) bundleDiscountPercent = weddingPackage.bundleDiscountPercent;
    if (weddingPackage?.quoteOnly) quoteRequired = true;
  }

  let coupon = null;
  let couponError = null;
  if (input.couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode } });
    if (!coupon) couponError = "This coupon code is not valid.";
  }

  const quote = computeQuote({
    sections,
    bundleDiscountPercent,
    bundleLabel: weddingPackage ? `${weddingPackage.name} saving` : "Package saving",
    coupon,
    serviceType: input.serviceType,
    taxRatePercent: business.taxRatePercent,
    taxLabel: business.taxLabel,
    advancePercent: business.advancePercent,
    minimumAdvance: business.minimumAdvance,
  });
  if (quote.coupon && !quote.coupon.valid) couponError = quote.coupon.reason;

  return {
    quote: { ...quote, notes, atActuals },
    route,
    routeError,
    distanceSource,
    quoteRequired,
    mapsLive: mapsConfigured(),
    lineItems,
    car: car ? { id: car.id, slug: car.slug, name: `${car.make} ${car.model}`, seats: car.seats } : null,
    couponError,
    weddingPackage: weddingPackage ? { slug: weddingPackage.slug, name: weddingPackage.name } : null,
  };
}

/** Options for the booking UI (public, active, no internal fields). */
export async function loadBookingCatalog() {
  const [cars, decorations, photoPackages, addOns, weddingPackages] = await Promise.all([
    prisma.car.findMany({
      where: { isActive: true, pricing: { isNot: null } },
      orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }],
      select: {
        slug: true, make: true, model: true, seats: true, decorationAvailable: true, luxuryLevel: true, isDemo: true,
        category: { select: { name: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
        pricing: { select: { baseFare: true, includedKm: true, includedHours: true, extraKmRate: true, pricingMode: true } },
      },
    }),
    prisma.decorationPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.photoPackage.findMany({ where: { isActive: true }, orderBy: [{ serviceType: "asc" }, { sortOrder: "asc" }] }),
    prisma.addOnService.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.weddingPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { cars, decorations, photoPackages, addOns, weddingPackages, mapsLive: mapsConfigured() };
}
