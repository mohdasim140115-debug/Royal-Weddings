"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/Field";
import TripFields, { emptyTrip } from "./TripFields";
import { CarPicker, DecorationPicker, PackagePicker, AddOnPicker } from "./ServicePickers";
import EstimatePanel from "./EstimatePanel";
import { useQuote, toQuoteInput } from "./useQuote";

function fromPackage(wp, catalog) {
  if (!wp) return { car: { slug: null, decorationSlug: null }, photo: [], addOns: [] };
  return {
    car: { slug: catalog.cars.some((c) => c.slug === wp.suggestedCarSlug) ? wp.suggestedCarSlug : null, decorationSlug: wp.decorationSlug || null },
    photo: wp.photoPackageSlug ? [{ slug: wp.photoPackageSlug, extraHours: 0, extraDays: 0 }] : [],
    addOns: Array.isArray(wp.addOnSlugs) ? wp.addOnSlugs.map((slug) => ({ slug, quantity: 1 })) : [],
  };
}

/** Live package builder: combine services, see the estimate, then continue to booking. */
export default function PackageBuilder({ catalog, initialPackage, initialTrip }) {
  const startPkg = catalog.weddingPackages.find((w) => w.slug === initialPackage) || null;
  const [pkgSlug, setPkgSlug] = useState(startPkg?.slug || null);
  const [sel, setSel] = useState(() => fromPackage(startPkg, catalog));
  const [eventDate, setEventDate] = useState(initialTrip.date || "");
  const [trip, setTrip] = useState({ ...emptyTrip, pickup: initialTrip.pickup || "", venue: initialTrip.venue || "", pickupPlaceId: initialTrip.pickupPlace || null, venuePlaceId: initialTrip.venuePlace || null });

  const selectedCar = catalog.cars.find((c) => c.slug === sel.car.slug);
  const empty = !sel.car.slug && sel.photo.length === 0;

  const input = useMemo(
    () => toQuoteInput({ service: "COMBINED", event: { eventDate }, trip, car: sel.car, photo: sel.photo, addOns: sel.addOns, weddingPackageSlug: pkgSlug }),
    [eventDate, trip, sel, pkgSlug]
  );
  const quoteState = useQuote(input, { enabled: !empty });

  function choosePackage(slug) {
    setPkgSlug(slug);
    setSel(fromPackage(catalog.weddingPackages.find((w) => w.slug === slug), catalog));
  }

  const params = new URLSearchParams({ service: "COMBINED" });
  if (pkgSlug) params.set("package", pkgSlug);
  if (sel.car.slug) params.set("car", sel.car.slug);
  if (sel.car.decorationSlug) params.set("deco", sel.car.decorationSlug);
  if (sel.photo.length) params.set("photo", sel.photo.map((p) => `${p.slug}:${p.extraHours}:${p.extraDays}`).join(","));
  if (sel.addOns.length) params.set("addons", sel.addOns.map((a) => `${a.slug}:${a.quantity}`).join(","));
  if (eventDate) params.set("date", eventDate);
  if (trip.pickup) params.set("pickup", trip.pickup);
  if (trip.venue) params.set("venue", trip.venue);
  if (trip.pickupPlaceId) params.set("pickupPlace", trip.pickupPlaceId);
  if (trip.venuePlaceId) params.set("venuePlace", trip.venuePlaceId);

  const quoteRequired = quoteState.data?.quoteRequired;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div className="grid min-w-0 gap-12">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-charcoal">Start from</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {catalog.weddingPackages.map((w) => (
              <button key={w.slug} type="button" onClick={() => choosePackage(w.slug)} aria-pressed={pkgSlug === w.slug} className="min-h-11 border border-line bg-white px-4 text-sm transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ivory">
                {w.name}
              </button>
            ))}
            <button type="button" onClick={() => { setPkgSlug(null); setSel(fromPackage(null)); }} className="inline-flex min-h-11 items-center gap-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone hover:text-ink">
              <RotateCcw className="size-3.5" aria-hidden="true" /> Start blank
            </button>
          </div>
        </div>

        <section aria-labelledby="b-car">
          <h3 id="b-car" className="text-3xl">1. Wedding car</h3>
          <p className="mt-1 text-sm text-stone">Optional. Remove it if you only need photography.</p>
          <div className="mt-5">
            <CarPicker cars={catalog.cars} value={sel.car.slug} allowNone onChange={(slug) => setSel((s) => ({ ...s, car: { slug, decorationSlug: catalog.cars.find((c) => c.slug === slug)?.decorationAvailable ? s.car.decorationSlug : null } }))} />
          </div>
          {sel.car.slug && (
            <div className="mt-8 grid gap-8">
              <DecorationPicker decorations={catalog.decorations} value={sel.car.decorationSlug} disabled={!selectedCar?.decorationAvailable} onChange={(d) => setSel((s) => ({ ...s, car: { ...s.car, decorationSlug: d } }))} />
              <details className="border border-line bg-white" open={Boolean(trip.pickup || trip.venue)}>
                <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">Trip details — needed to price the car</summary>
                <div className="grid gap-5 border-t border-line p-4">
                  <Input label="Event date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  <TripFields trip={trip} onChange={setTrip} mapsLive={catalog.mapsLive} maxSeats={selectedCar?.seats} />
                </div>
              </details>
            </div>
          )}
        </section>

        <section aria-labelledby="b-photo">
          <h3 id="b-photo" className="text-3xl">2. Photography & films</h3>
          <div className="mt-5">
            <PackagePicker packages={catalog.photoPackages} value={sel.photo} onChange={(v) => setSel((s) => ({ ...s, photo: v }))} />
          </div>
        </section>

        <section aria-labelledby="b-addons">
          <h3 id="b-addons" className="sr-only">3. Additional services</h3>
          <AddOnPicker addOns={catalog.addOns} value={sel.addOns} onChange={(v) => setSel((s) => ({ ...s, addOns: v }))} />
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <EstimatePanel quoteState={empty ? { data: null, loading: false, error: null } : quoteState} waitingFor="Add a car or a photography package to see your live estimate." />
        <div className="mt-4 grid gap-3">
          <Link
            href={`/booking?${params}`}
            aria-disabled={empty}
            className={`inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-charcoal ${empty ? "pointer-events-none opacity-50" : ""}`}
          >
            Continue to booking <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/contact" className="inline-flex min-h-12 items-center justify-center border border-ink px-6 text-[0.72rem] font-semibold uppercase tracking-[0.16em] hover:bg-ink hover:text-ivory">
            Request a custom quote
          </Link>
          {quoteRequired && <p className="text-xs text-stone">Some selections need vendor approval — the final price will be confirmed manually.</p>}
        </div>
      </aside>
    </div>
  );
}
