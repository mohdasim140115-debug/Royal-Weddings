import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeVehicleCharges,
  computePhotoPackageCharges,
  computeAddOnCharge,
  computeQuote,
  evaluateCoupon,
  overlapsNight,
} from "../src/lib/pricing.js";

const packageRule = {
  baseFare: 8000,
  includedKm: 80,
  includedHours: 8,
  extraKmRate: 40,
  extraHourRate: 600,
  minimumFare: 0,
  minimumKm: 0,
  minimumHours: 0,
  driverAllowancePerDay: 500,
  waitingChargePerHour: 0,
  freeWaitingMinutes: 0,
  nightCharge: 750,
  nightStartHour: 22,
  nightEndHour: 6,
  outstationPerDayCharge: 0,
  outstationMinKmPerDay: 0,
  tollPolicy: "Tolls at actuals",
  parkingPolicy: "Parking at actuals",
};

const sum = (r) => r.lines.reduce((s, l) => s + l.amount, 0);
const line = (r, key) => r.lines.find((l) => l.key === key);

test("trip within included km/hours charges only base fare + allowance", () => {
  const r = computeVehicleCharges(packageRule, { totalKm: 60, driveMinutes: 120, waitingMinutes: 180, pickupTime: "10:00" });
  assert.equal(line(r, "base").amount, 8000);
  assert.equal(line(r, "distance"), undefined, "no extra km inside included distance");
  assert.equal(line(r, "hours"), undefined);
  assert.equal(r.subtotal, 8500);
});

test("included kilometres are not charged twice", () => {
  const r = computeVehicleCharges(packageRule, { totalKm: 100.2, driveMinutes: 180, waitingMinutes: 0, pickupTime: "10:00" });
  // 100.2 km rounds up to 101; 101 − 80 included = 21 extra
  assert.equal(line(r, "distance").amount, 21 * 40);
  assert.equal(r.subtotal, 8000 + 840 + 500);
});

test("extra hours include waiting time", () => {
  const r = computeVehicleCharges(packageRule, { totalKm: 50, driveMinutes: 150, waitingMinutes: 420, pickupTime: "09:00" });
  // 570 min => 10 hrs chargeable, 2 beyond included 8
  assert.equal(line(r, "hours").amount, 2 * 600);
  assert.equal(line(r, "waiting"), undefined, "waiting not double-charged on time-based vehicles");
});

test("pure per-km vehicle with minimum km and free waiting", () => {
  const rule = { ...packageRule, baseFare: 0, includedKm: 0, includedHours: 0, extraKmRate: 18, extraHourRate: 0, minimumKm: 80, waitingChargePerHour: 200, freeWaitingMinutes: 60, nightCharge: 0, driverAllowancePerDay: 0 };
  const r = computeVehicleCharges(rule, { totalKm: 30, driveMinutes: 60, waitingMinutes: 150, pickupTime: "11:00" });
  assert.equal(r.chargeableKm, 80);
  assert.equal(line(r, "distance").amount, 80 * 18);
  // 150 − 60 free = 90 min => 1.5 hr × 200
  assert.equal(line(r, "waiting").amount, 300);
});

test("minimum fare tops up instead of adding on", () => {
  const rule = { ...packageRule, baseFare: 0, includedKm: 0, includedHours: 0, extraKmRate: 20, extraHourRate: 0, minimumFare: 3000, driverAllowancePerDay: 0, nightCharge: 0 };
  const r = computeVehicleCharges(rule, { totalKm: 40, driveMinutes: 60, waitingMinutes: 0 });
  assert.equal(line(r, "distance").amount, 800);
  assert.equal(line(r, "minimum").amount, 2200);
  assert.equal(r.subtotal, 3000);
  const r2 = computeVehicleCharges(rule, { totalKm: 200, driveMinutes: 200, waitingMinutes: 0 });
  assert.equal(line(r2, "minimum"), undefined);
});

test("round trip distance is billed from the total route distance", () => {
  const oneWay = computeVehicleCharges(packageRule, { totalKm: 70, oneWayKm: 70, driveMinutes: 90 });
  const round = computeVehicleCharges(packageRule, { totalKm: 140, oneWayKm: 70, driveMinutes: 180 });
  assert.equal(line(oneWay, "distance"), undefined);
  assert.equal(line(round, "distance").amount, 60 * 40);
});

test("night charge applies when service runs into night window", () => {
  assert.equal(overlapsNight(20 * 60, 3 * 60, 22, 6), true);
  assert.equal(overlapsNight(9 * 60, 4 * 60, 22, 6), false);
  assert.equal(overlapsNight(5 * 60, 30, 22, 6), true);
  const r = computeVehicleCharges(packageRule, { totalKm: 40, driveMinutes: 120, waitingMinutes: 120, pickupTime: "20:30" });
  assert.equal(line(r, "night").amount, 750);
});

test("outstation applies per-day minimum km, allowance and charge", () => {
  const rule = { ...packageRule, outstationPerDayCharge: 1000, outstationMinKmPerDay: 250 };
  const r = computeVehicleCharges(rule, { totalKm: 300, driveMinutes: 400, waitingMinutes: 0, days: 2, outstation: true, pickupTime: "07:00" });
  assert.equal(r.chargeableKm, 500);
  assert.equal(line(r, "base").amount, 16000);
  assert.equal(line(r, "distance").amount, (500 - 160) * 40);
  assert.equal(line(r, "driver").amount, 1000);
  assert.equal(line(r, "outstation").amount, 2000);
});

test("tolls from the route provider are not taxed", () => {
  const r = computeVehicleCharges(packageRule, { totalKm: 50, driveMinutes: 60, tollEstimate: 270 });
  const q = computeQuote({ sections: [{ title: "Car", lines: r.lines }], taxRatePercent: 18 });
  assert.equal(q.tax, Math.round((r.subtotal - 270) * 0.18));
  assert.equal(q.total, r.subtotal + q.tax);
});

test("quote-only photography packages add nothing and are flagged", () => {
  const p = computePhotoPackageCharges({ slug: "sig", name: "Signature", tier: "Signature", quoteOnly: true, price: null });
  assert.equal(p.quoteOnly, true);
  const q = computeQuote({ sections: [{ title: "Signature", lines: p.lines, quoteOnly: true }] });
  assert.deepEqual(q.quoteOnlyItems, ["Signature"]);
  assert.equal(q.total, 0);
});

test("photo package extras and add-on quantities", () => {
  const p = computePhotoPackageCharges({ slug: "c", name: "Classic", tier: "Classic", price: 50000, extraHourRate: 3000, extraDayRate: 20000 }, { extraHours: 2, extraDays: 1 });
  assert.equal(p.subtotal, 50000 + 6000 + 20000);
  assert.equal(computeAddOnCharge({ slug: "x", name: "Drone", price: 5000, unit: "PER_DAY" }, 2).amount, 10000);
  assert.equal(computeAddOnCharge({ slug: "y", name: "Flat", price: 999, unit: "FLAT" }, 7).amount, 999);
});

test("coupons validate windows, limits, scope and minimums", () => {
  const now = new Date("2026-10-01");
  const base = { code: "X", isActive: true, type: "PERCENT", value: 10, minSubtotal: 0, usedCount: 0, appliesTo: "ALL" };
  assert.equal(evaluateCoupon(base, { subtotal: 10000, serviceType: "CAR", now }).amount, 1000);
  assert.equal(evaluateCoupon({ ...base, maxDiscount: 500 }, { subtotal: 10000, now }).amount, 500);
  assert.equal(evaluateCoupon({ ...base, isActive: false }, { subtotal: 10000, now }).valid, false);
  assert.equal(evaluateCoupon({ ...base, validTo: "2026-09-01" }, { subtotal: 10000, now }).valid, false);
  assert.equal(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, { subtotal: 10000, now }).valid, false);
  assert.equal(evaluateCoupon({ ...base, appliesTo: "PHOTOGRAPHY" }, { subtotal: 10000, serviceType: "CAR", now }).valid, false);
  assert.equal(evaluateCoupon({ ...base, minSubtotal: 20000 }, { subtotal: 10000, now }).valid, false);
  assert.equal(evaluateCoupon({ ...base, type: "FLAT", value: 99999 }, { subtotal: 10000, now }).amount, 10000);
});

test("quote: bundle discount only when configured, tax after discounts, advance", () => {
  const sections = [{ title: "A", lines: [{ key: "a", label: "A", amount: 100000, taxable: true }] }];
  const none = computeQuote({ sections, taxRatePercent: 18 });
  assert.equal(none.discountTotal, 0);
  assert.equal(none.total, 118000);
  const q = computeQuote({ sections, bundleDiscountPercent: 5, taxRatePercent: 18, advancePercent: 25, minimumAdvance: 2000 });
  assert.equal(q.discountTotal, 5000);
  assert.equal(q.tax, Math.round(95000 * 0.18));
  assert.equal(q.total, 95000 + 17100);
  assert.equal(q.advance, Math.ceil((112100 * 0.25) / 100) * 100);
});

test("vehicle sum equals subtotal", () => {
  const r = computeVehicleCharges(packageRule, { totalKm: 123, driveMinutes: 500, waitingMinutes: 200, pickupTime: "21:00" });
  assert.equal(sum(r), r.subtotal);
});
