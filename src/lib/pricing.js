// ─────────────────────────────────────────────────────────────
// Pricing engine — pure functions, no I/O, safe to unit test.
// All amounts are whole rupees. The server is the only place that
// calls this with trusted inputs (rates come from the database, distance
// from the routing provider); client-submitted prices are never used.
//
// Vehicle formula (per booking):
//   base fare × days                         (covers includedKm & includedHours per day)
// + max(0, chargeableKm − includedKm × days) × extraKmRate
// + max(0, chargeableHours − includedHours × days) × extraHourRate   (time incl. waiting)
//   — or, for pure per-km vehicles (extraHourRate = 0) —
// + chargeable waiting (after free minutes) × waitingChargePerHour
// + minimum-fare top-up (only if the above is below minimumFare)
// + driver allowance × days
// + night charge (if the trip runs into the night window)
// + outstation charge × days (outstation trips)
//
// chargeableKm    = max(actual route km, minimumKm, outstationMinKmPerDay × days)
// chargeableHours = max(drive time + waiting, minimumHours), rounded up to the hour
//
// Included kilometres are never charged twice: they are paid for by the
// base fare and subtracted before extra-distance is calculated.
// ─────────────────────────────────────────────────────────────

const round = (n) => Math.round(Number(n) || 0);
const nonNeg = (n) => Math.max(0, Number(n) || 0);

export function formatKm(km) {
  const v = Number(km) || 0;
  return v >= 100 ? `${Math.round(v)} km` : `${v.toFixed(1)} km`;
}

function parseTime(hhmm) {
  if (typeof hhmm !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** True when any part of [startMin, startMin + durationMin) falls in the night window. */
export function overlapsNight(startMin, durationMin, nightStartHour, nightEndHour) {
  if (startMin == null) return false;
  const ns = nightStartHour * 60;
  const ne = nightEndHour * 60;
  const isNight = (t) => {
    const d = ((t % 1440) + 1440) % 1440;
    return ns > ne ? d >= ns || d < ne : d >= ns && d < ne;
  };
  const end = startMin + Math.max(0, durationMin);
  for (let t = startMin; t < Math.max(end, startMin + 1); t += 15) {
    if (isNight(t)) return true;
  }
  return false;
}

/**
 * Vehicle charges for one booking.
 * @param {object} rule  VehiclePricingRule row
 * @param {object} trip  { totalKm, oneWayKm, driveMinutes, waitingMinutes, pickupTime, days, outstation, tollEstimate }
 */
export function computeVehicleCharges(rule, trip) {
  const days = Math.max(1, Math.floor(Number(trip.days) || 1));
  const outstation = Boolean(trip.outstation);
  const totalKm = nonNeg(trip.totalKm);
  const driveMinutes = nonNeg(trip.driveMinutes);
  const waitingMinutes = nonNeg(trip.waitingMinutes);

  const kmFloor = Math.max(
    nonNeg(rule.minimumKm),
    outstation ? nonNeg(rule.outstationMinKmPerDay) * days : 0
  );
  const chargeableKm = Math.max(Math.ceil(totalKm), kmFloor);

  const usageMinutes = driveMinutes + waitingMinutes;
  const chargeableHours = Math.max(Math.ceil(usageMinutes / 60), nonNeg(rule.minimumHours));

  const includedKm = nonNeg(rule.includedKm) * days;
  const includedHours = nonNeg(rule.includedHours) * days;
  const timeBased = nonNeg(rule.extraHourRate) > 0;

  const lines = [];
  const notes = [];

  if (rule.baseFare > 0) {
    const covers = [];
    if (rule.includedKm > 0) covers.push(`${rule.includedKm} km`);
    if (rule.includedHours > 0) covers.push(`${rule.includedHours} hrs`);
    lines.push({
      key: "base",
      label: days > 1 ? `Base fare × ${days} days` : "Base fare",
      detail: covers.length ? `Includes ${covers.join(" / ")}${days > 1 ? " per day" : ""}` : null,
      amount: round(rule.baseFare * days),
    });
  }

  const extraKm = Math.max(0, chargeableKm - includedKm);
  if (extraKm > 0 && rule.extraKmRate > 0) {
    lines.push({
      key: "distance",
      label: includedKm > 0 ? "Distance beyond included km" : "Distance charge",
      detail: `${extraKm} km × ₹${rule.extraKmRate}/km`,
      amount: round(extraKm * rule.extraKmRate),
    });
  }
  if (chargeableKm > Math.ceil(totalKm)) {
    notes.push(`A minimum of ${chargeableKm} km applies to this booking.`);
  }

  if (timeBased) {
    const extraHours = Math.max(0, chargeableHours - includedHours);
    if (extraHours > 0) {
      lines.push({
        key: "hours",
        label: includedHours > 0 ? "Additional hours (incl. waiting)" : "Hourly charge (incl. waiting)",
        detail: `${extraHours} hr × ₹${rule.extraHourRate}/hr`,
        amount: round(extraHours * rule.extraHourRate),
      });
    }
  } else if (rule.waitingChargePerHour > 0) {
    const billableWait = Math.max(0, waitingMinutes - nonNeg(rule.freeWaitingMinutes));
    const waitHours = Math.ceil((billableWait / 60) * 2) / 2; // half-hour steps
    if (waitHours > 0) {
      lines.push({
        key: "waiting",
        label: "Waiting charges",
        detail: `${waitHours} hr × ₹${rule.waitingChargePerHour}/hr${
          rule.freeWaitingMinutes ? ` (first ${rule.freeWaitingMinutes} min free)` : ""
        }`,
        amount: round(waitHours * rule.waitingChargePerHour),
      });
    }
  }

  const usageSubtotal = lines.reduce((s, l) => s + l.amount, 0);
  if (rule.minimumFare > 0 && usageSubtotal < rule.minimumFare) {
    lines.push({
      key: "minimum",
      label: "Minimum booking adjustment",
      detail: `Minimum fare ₹${rule.minimumFare.toLocaleString("en-IN")}`,
      amount: round(rule.minimumFare - usageSubtotal),
    });
  }

  if (rule.driverAllowancePerDay > 0) {
    lines.push({
      key: "driver",
      label: "Chauffeur allowance",
      detail: days > 1 ? `₹${rule.driverAllowancePerDay} × ${days} days` : null,
      amount: round(rule.driverAllowancePerDay * days),
    });
  }

  if (rule.nightCharge > 0) {
    const start = parseTime(trip.pickupTime);
    const nights = days > 1 ? days - 1 : overlapsNight(start, usageMinutes, rule.nightStartHour, rule.nightEndHour) ? 1 : 0;
    if (nights > 0) {
      lines.push({
        key: "night",
        label: "Night charge",
        detail: `Service between ${rule.nightStartHour}:00 and ${rule.nightEndHour}:00${nights > 1 ? ` × ${nights}` : ""}`,
        amount: round(rule.nightCharge * nights),
      });
    }
  }

  if (outstation && rule.outstationPerDayCharge > 0) {
    lines.push({
      key: "outstation",
      label: "Outstation charge",
      detail: `₹${rule.outstationPerDayCharge} × ${days} day${days > 1 ? "s" : ""}`,
      amount: round(rule.outstationPerDayCharge * days),
    });
  }

  if (trip.tollEstimate && trip.tollEstimate > 0) {
    lines.push({
      key: "tolls",
      label: "Estimated tolls",
      detail: "Estimate from the routing provider; billed at actuals",
      amount: round(trip.tollEstimate),
      taxable: false,
    });
  }

  const atActuals = [];
  if (!trip.tollEstimate) atActuals.push({ label: "Tolls", note: rule.tollPolicy });
  atActuals.push({ label: "Parking", note: rule.parkingPolicy });

  return {
    lines: lines.map((l) => ({ taxable: true, ...l })),
    subtotal: lines.reduce((s, l) => s + l.amount, 0),
    chargeableKm,
    chargeableHours,
    days,
    notes,
    atActuals,
  };
}

/** Price for one photography / videography package with optional extras. */
export function computePhotoPackageCharges(pkg, { extraHours = 0, extraDays = 0 } = {}) {
  if (pkg.quoteOnly || pkg.price == null) {
    return { quoteOnly: true, lines: [], subtotal: 0 };
  }
  const lines = [{ key: `pkg-${pkg.slug}`, label: pkg.name, detail: pkg.tier, amount: round(pkg.price), taxable: true }];
  const eh = Math.min(24, Math.max(0, Math.floor(extraHours)));
  const ed = Math.min(10, Math.max(0, Math.floor(extraDays)));
  if (eh > 0 && pkg.extraHourRate > 0) {
    lines.push({ key: `pkg-${pkg.slug}-hours`, label: "Extra coverage hours", detail: `${eh} hr × ₹${pkg.extraHourRate}`, amount: round(eh * pkg.extraHourRate), taxable: true });
  }
  if (ed > 0 && pkg.extraDayRate > 0) {
    lines.push({ key: `pkg-${pkg.slug}-days`, label: "Extra event days", detail: `${ed} day × ₹${pkg.extraDayRate}`, amount: round(ed * pkg.extraDayRate), taxable: true });
  }
  return { quoteOnly: false, lines, subtotal: lines.reduce((s, l) => s + l.amount, 0) };
}

export function computeAddOnCharge(addon, quantity = 1) {
  const qty = addon.unit === "FLAT" ? 1 : Math.min(50, Math.max(1, Math.floor(quantity) || 1));
  const unitLabel = { PER_HOUR: "hr", PER_DAY: "day", PER_UNIT: "unit" }[addon.unit];
  return {
    key: `addon-${addon.slug}`,
    label: addon.name,
    detail: unitLabel ? `${qty} ${unitLabel} × ₹${addon.price}` : null,
    amount: round(addon.price * qty),
    quantity: qty,
    taxable: true,
  };
}

/**
 * Validates a coupon against a subtotal. Returns { valid, reason?, amount }.
 * Discounts only apply when a coupon exists, is active and in its window.
 */
export function evaluateCoupon(coupon, { subtotal, serviceType, now = new Date() }) {
  if (!coupon) return { valid: false, reason: "Coupon not found.", amount: 0 };
  if (!coupon.isActive) return { valid: false, reason: "This coupon is no longer active.", amount: 0 };
  if (coupon.validFrom && now < new Date(coupon.validFrom)) return { valid: false, reason: "This coupon is not active yet.", amount: 0 };
  if (coupon.validTo && now > new Date(coupon.validTo)) return { valid: false, reason: "This coupon has expired.", amount: 0 };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return { valid: false, reason: "This coupon has reached its usage limit.", amount: 0 };
  if (coupon.appliesTo && coupon.appliesTo !== "ALL" && coupon.appliesTo !== serviceType) {
    return { valid: false, reason: "This coupon does not apply to the selected services.", amount: 0 };
  }
  if (subtotal < (coupon.minSubtotal || 0)) {
    return { valid: false, reason: `Minimum order of ₹${coupon.minSubtotal.toLocaleString("en-IN")} required.`, amount: 0 };
  }
  let amount = coupon.type === "PERCENT" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount != null) amount = Math.min(amount, coupon.maxDiscount);
  amount = Math.min(round(amount), subtotal);
  return { valid: amount > 0, reason: amount > 0 ? null : "Coupon gives no discount on this order.", amount };
}

/**
 * Builds the complete itemised quote.
 * sections: [{ title, lines, quoteOnly? }]
 */
export function computeQuote({
  sections = [],
  bundleDiscountPercent = 0,
  bundleLabel = "Package saving",
  coupon = null,
  serviceType = "CAR",
  taxRatePercent = 0,
  taxLabel = "Tax",
  advancePercent = 0,
  minimumAdvance = 0,
  now = new Date(),
}) {
  const allLines = sections.flatMap((s) => s.lines);
  const taxableSubtotal = allLines.filter((l) => l.taxable !== false).reduce((s, l) => s + l.amount, 0);
  const nonTaxable = allLines.filter((l) => l.taxable === false).reduce((s, l) => s + l.amount, 0);
  const subtotal = taxableSubtotal + nonTaxable;

  const discounts = [];
  let remaining = taxableSubtotal;
  if (bundleDiscountPercent > 0 && remaining > 0) {
    const amt = Math.min(remaining, round((remaining * bundleDiscountPercent) / 100));
    if (amt > 0) {
      discounts.push({ key: "bundle", label: `${bundleLabel} (${bundleDiscountPercent}%)`, amount: amt });
      remaining -= amt;
    }
  }
  let couponResult = null;
  if (coupon !== null && coupon !== undefined) {
    couponResult = evaluateCoupon(coupon, { subtotal: remaining, serviceType, now });
    if (couponResult.valid) {
      discounts.push({ key: "coupon", label: `Coupon ${coupon.code}`, amount: couponResult.amount });
      remaining -= couponResult.amount;
    }
  }
  const discountTotal = discounts.reduce((s, d) => s + d.amount, 0);
  const tax = round((remaining * taxRatePercent) / 100);
  const total = remaining + tax + nonTaxable;

  const quoteOnlyItems = sections.filter((s) => s.quoteOnly).map((s) => s.title);
  const advance =
    total > 0 ? Math.min(total, Math.max(minimumAdvance, Math.ceil((total * advancePercent) / 100 / 100) * 100)) : 0;

  return {
    sections,
    subtotal,
    discounts,
    discountTotal,
    taxableAmount: remaining,
    taxRatePercent,
    taxLabel,
    tax,
    total,
    advance,
    quoteOnlyItems,
    coupon: couponResult ? { code: coupon?.code ?? null, ...couponResult } : null,
  };
}
