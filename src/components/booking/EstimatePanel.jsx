"use client";

import { Loader2, Route, AlertTriangle, Info } from "lucide-react";
import PriceBreakdown from "./PriceBreakdown";
import { formatDuration } from "@/lib/format";

export function RouteSummary({ route, distanceSource }) {
  if (!route) return null;
  const manual = distanceSource === "MANUAL";
  return (
    <div className="border border-line bg-sand/60 p-4 text-sm">
      <p className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-champagne-deep">
        <Route className="size-3.5" aria-hidden="true" />
        {manual ? "Manual distance (to be verified)" : "Live driving route"}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-stone">One way</dt>
          <dd className="font-display text-2xl">{route.oneWayKm} km</dd>
          {!manual && <dd className="text-xs text-stone">{formatDuration(route.oneWayMinutes)}</dd>}
        </div>
        <div>
          <dt className="text-xs text-stone">{route.garage ? "Total billed (garage to garage)" : route.roundTrip ? "Round trip total" : "Total billed route"}</dt>
          <dd className="font-display text-2xl">{route.totalKm} km</dd>
          {!manual && <dd className="text-xs text-stone">{formatDuration(route.totalMinutes)} driving</dd>}
        </div>
      </dl>
      {route.garage && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-stone">
          <li className="flex justify-between gap-3"><span>Garage ({route.garage.base}) → pickup</span><span className="text-ink">{route.garage.toStartKm} km</span></li>
          <li className="flex justify-between gap-3"><span>{route.roundTrip ? "Pickup → venue → pickup" : "Pickup → venue"}</span><span className="text-ink">{route.tripKm} km</span></li>
          <li className="flex justify-between gap-3"><span>{route.roundTrip ? "Pickup" : "Venue"} → garage ({route.garage.base})</span><span className="text-ink">{route.garage.fromEndKm} km</span></li>
        </ul>
      )}
    </div>
  );
}

/** Live estimate: route + itemised price, with honest states for every failure mode. */
export default function EstimatePanel({ quoteState, waitingFor, className = "" }) {
  const { data, loading, error } = quoteState;
  return (
    <section aria-labelledby="estimate-title" aria-live="polite" aria-busy={loading} className={`border border-line bg-white ${className}`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="estimate-title" className="text-2xl">Your estimate</h2>
        {loading && (
          <span className="flex items-center gap-2 text-xs text-stone">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Calculating…
          </span>
        )}
      </div>
      <div className={`space-y-4 p-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
        {waitingFor && !data && !error && <p className="text-sm text-stone">{waitingFor}</p>}
        {error && (
          <p className="flex gap-2 text-sm text-danger" role="alert">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {data && (
          <>
            {data.mapsLive === false && data.car && (
              <p className="flex gap-2 border border-champagne/40 bg-champagne-soft/20 p-3 text-xs leading-relaxed text-charcoal">
                <Info className="mt-0.5 size-3.5 shrink-0 text-champagne-deep" aria-hidden="true" />
                Live route calculation is not enabled on this site. Enter an approximate one-way distance, or submit the request for a manual quote.
              </p>
            )}
            {data.routeError && (
              <p className="flex gap-2 text-sm text-burgundy" role="alert">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {data.routeError.message} You can still submit this as a quote request.
              </p>
            )}
            <RouteSummary route={data.route} distanceSource={data.distanceSource} />
            {data.car && !data.route && !data.routeError && (
              <p className="text-sm text-stone">
                {data.mapsLive ? "Enter the pickup and venue addresses to calculate the driving distance for " : "Add an approximate distance to price "}
                the {data.car.name}.
              </p>
            )}
            {data.couponError && <p className="text-xs text-danger">{data.couponError}</p>}
            {data.quote.sections.length > 0 ? <PriceBreakdown quote={data.quote} compact /> : !data.car && <p className="text-sm text-stone">Select services to see an itemised estimate.</p>}
            {data.quoteRequired && data.quote.sections.length > 0 && (
              <p className="border-t border-line pt-3 text-xs text-stone">Some items need a manual review — we will confirm the final quote with you before anything is booked.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
