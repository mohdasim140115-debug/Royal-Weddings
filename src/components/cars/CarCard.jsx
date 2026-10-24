import Link from "next/link";
import { Users, Briefcase, Snowflake, Flower2, ArrowUpRight } from "lucide-react";
import CarImage from "@/components/ui/CarImage";
import QuickBookButton from "@/components/booking/QuickBookButton";
import { pricingSummary, carName } from "@/lib/car-display";
import { LUXURY_LABELS } from "@/lib/format";

/**
 * Editorial vehicle card. `availability` is only passed when the visitor
 * picked a date: "RESERVED" (a real block exists) or "ON_REQUEST".
 */
export default function CarCard({ car, availability, bookingQuery = "", layout = "grid", priority = false }) {
  const name = carName(car);
  const price = pricingSummary(car.pricing);
  const image = car.images?.[0];
  const list = layout === "list";
  const bookHref = `/booking?service=CAR&car=${car.slug}${bookingQuery ? `&${bookingQuery}` : ""}`;

  return (
    <article className={`group relative flex overflow-hidden border border-line/80 bg-white transition-all duration-500 ease-[var(--ease-luxe)] hover:-translate-y-1 hover:border-ink/15 hover:shadow-lift ${list ? "flex-col sm:flex-row" : "flex-col"}`}>
      <div className={`relative overflow-hidden bg-sand ${list ? "aspect-[16/10] sm:aspect-auto sm:w-[40%] sm:shrink-0" : "aspect-[16/10]"}`}>
        <CarImage image={image} name={name} sizes={list ? "(min-width: 640px) 40vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"} priority={priority} className="img-zoom" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="bg-ink/75 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ivory backdrop-blur-sm">{LUXURY_LABELS[car.luxuryLevel]}</span>
          {availability === "RESERVED" && <span className="bg-burgundy px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ivory">Reserved on this date</span>}
        </div>
        {car.isDemo && <span className="absolute bottom-3 left-3 bg-ivory/90 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-stone">Sample listing</span>}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-champagne-deep">{car.make}</p>
            <h3 className="mt-1 text-[1.5rem] leading-tight">
              <Link href={`/cars/${car.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {car.model}
              </Link>
              <span className="sr-only"> — {name}</span>
            </h3>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-charcoal transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory" aria-hidden="true">
            <ArrowUpRight className="size-4" />
          </span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.72rem] text-stone">
          <li className="flex items-center gap-1.5"><Users className="size-3.5 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />{car.seats} guests</li>
          <li className="flex items-center gap-1.5"><Briefcase className="size-3.5 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />{car.luggageBags} {car.luggageBags === 1 ? "bag" : "bags"}</li>
          <li className="flex items-center gap-1.5"><Snowflake className="size-3.5 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />{car.airConditioned ? "AC" : "Non-AC"}</li>
          {car.decorationAvailable && <li className="flex items-center gap-1.5"><Flower2 className="size-3.5 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />Décor</li>}
        </ul>

        {availability === "ON_REQUEST" && <p className="mt-3 text-xs text-stone">Availability for your date is confirmed on request.</p>}

        <div className="min-h-4 flex-1" aria-hidden="true" />
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line/70 pt-4">
          <div>
            <p className="font-display text-[1.6rem] leading-none">{price.headline}</p>
            <p className="mt-1 text-[0.68rem] text-stone">{[price.sub, price.minimum].filter(Boolean).join(" · ") || "Starting price"}</p>
          </div>
          <QuickBookButton
            car={car.slug}
            href={bookHref}
            aria-label={`Book ${name}`}
            className="relative z-10 inline-flex min-h-10 items-center bg-ink px-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-navy"
          >
            Book
          </QuickBookButton>
        </div>
      </div>
    </article>
  );
}
