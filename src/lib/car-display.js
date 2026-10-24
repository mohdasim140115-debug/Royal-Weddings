import { formatINR } from "./format.js";

/** Headline price + the rule that goes with it, for cards and detail pages. */
export function pricingSummary(p) {
  if (!p) return { headline: "Price on request", sub: null, minimum: null };
  let headline;
  let sub;
  if (p.pricingMode === "PER_KM" || (!p.baseFare && p.extraKmRate && !p.extraHourRate)) {
    headline = `${formatINR(p.extraKmRate)}/km`;
    sub = p.minimumKm ? `Minimum ${p.minimumKm} km` : "Charged per kilometre";
  } else if (p.pricingMode === "HOURLY" || (!p.baseFare && p.extraHourRate)) {
    headline = `${formatINR(p.extraHourRate)}/hr`;
    sub = [p.minimumHours ? `Minimum ${p.minimumHours} hrs` : null, p.extraKmRate ? `+ ${formatINR(p.extraKmRate)}/km` : null].filter(Boolean).join(" · ");
  } else {
    headline = formatINR(p.baseFare);
    sub = [p.includedHours ? `${p.includedHours} hrs` : null, p.includedKm ? `${p.includedKm} km` : null].filter(Boolean).join(" / ");
    sub = sub ? `Includes ${sub}` : null;
  }
  const minimum = p.minimumFare ? `Minimum booking ${formatINR(p.minimumFare)}` : p.minimumHours ? `Minimum ${p.minimumHours} hours` : p.minimumKm ? `Minimum ${p.minimumKm} km` : null;
  return { headline, sub, minimum };
}

export const carName = (c) => `${c.make} ${c.model}`;
