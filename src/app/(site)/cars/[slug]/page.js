import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Briefcase, Snowflake, UserCheck, Flower2, Check, Calculator } from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Badge from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import QuickBookButton from "@/components/booking/QuickBookButton";
import Notice from "@/components/ui/Notice";
import CarGallery from "@/components/cars/CarGallery";
import CarCard from "@/components/cars/CarCard";
import AvailabilityChecker from "@/components/cars/AvailabilityChecker";
import EnquiryForm from "@/components/cars/EnquiryForm";
import { prisma } from "@/lib/db";
import { carCardInclude } from "@/lib/queries";
import { pricingSummary, carName } from "@/lib/car-display";
import { formatINR, LUXURY_LABELS } from "@/lib/format";
import { site, PRICE_DISCLAIMER } from "@/config/site";

async function getCar(slug) {
  return prisma.car.findFirst({
    where: { slug, isActive: true },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } }, pricing: true },
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const car = await getCar(slug);
  if (!car) return { title: "Car not found" };
  const name = carName(car);
  return {
    title: `${name} Wedding Car Hire`,
    description: `${name} with chauffeur for weddings — ${car.seats} guests, ${car.airConditioned ? "air-conditioned" : "classic non-AC"}, ${car.decorationAvailable ? "floral decoration available" : ""}. ${car.description}`.slice(0, 158),
    alternates: { canonical: `/cars/${car.slug}` },
    openGraph: { title: `${name} · ${site.name}`, images: car.images[0] ? [{ url: car.images[0].url, alt: car.images[0].alt }] : undefined },
  };
}

function Row({ label, value, note }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-line py-3.5 text-sm last:border-0">
      <dt className="text-charcoal">
        {label}
        {note && <span className="mt-0.5 block text-xs text-stone">{note}</span>}
      </dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export default async function CarDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const car = await getCar(slug);
  if (!car) notFound();

  const [related, decorations] = await Promise.all([
    prisma.car.findMany({ where: { isActive: true, categoryId: car.categoryId, NOT: { id: car.id } }, include: carCardInclude, take: 3, orderBy: { popularity: "desc" } }),
    car.decorationAvailable ? prisma.decorationPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }) : [],
  ]);

  const name = carName(car);
  const p = car.pricing;
  const price = pricingSummary(p);
  const highlights = Array.isArray(car.highlights) ? car.highlights : [];
  const carry = new URLSearchParams({ service: "CAR", car: car.slug });
  for (const k of ["pickup", "venue", "pickupPlace", "venuePlace", "date"]) if (typeof sp[k] === "string" && sp[k]) carry.set(k, sp[k]);

  const jsonLd = !car.isDemo && p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${name} wedding car hire`,
        description: car.description,
        image: car.images.map((i) => `${site.url}${i.url}`),
        brand: { "@type": "Brand", name: car.make },
        offers: { "@type": "Offer", priceCurrency: "INR", price: p.baseFare || p.minimumFare || undefined, url: `${site.url}/cars/${car.slug}` },
      }
    : null;

  return (
    <>
      <div className="container-x pt-28 sm:pt-32">
        <Breadcrumbs items={[{ label: "Wedding Cars", href: "/cars" }, { label: car.category.name, href: `/cars?category=${car.category.slug}` }, { label: name }]} />
      </div>

      <section className="container-x grid gap-10 pb-16 pt-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <CarGallery images={car.images} name={name} />
          {car.images.length > 0 && <p className="mt-3 text-xs text-stone">{car.isDemo ? "Representative photograph. Actual vehicle colour and trim may differ." : "Photographs of the vehicle offered."}</p>}
        </div>

        <div className="lg:col-span-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold">{car.category.name}</Badge>
            <Badge>{LUXURY_LABELS[car.luxuryLevel]}</Badge>
            {car.isDemo && <Badge>Sample listing</Badge>}
          </div>
          <h1 className="mt-5 text-5xl leading-[1] sm:text-6xl">{name}</h1>
          {car.variant && <p className="mt-2 text-sm uppercase tracking-[0.16em] text-stone">{car.variant}</p>}
          <p className="mt-6 text-base leading-relaxed text-charcoal">{car.description}</p>

          <ul className="mt-6 grid grid-cols-2 gap-px border border-line bg-line text-sm">
            {[
              [Users, `${car.seats} passengers`],
              [Briefcase, `${car.luggageBags} luggage bag${car.luggageBags === 1 ? "" : "s"}`],
              [Snowflake, car.airConditioned ? "Air-conditioned" : "Non-AC (classic)"],
              [UserCheck, car.chauffeurAvailable ? "Chauffeur included" : "Self-drive only"],
              [Flower2, car.decorationAvailable ? "Decoration available" : "No decoration"],
            ].map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-3 bg-ivory px-4 py-3.5 last:odd:col-span-2">
                <Icon className="size-4 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 border border-ink/90 bg-white p-6">
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-stone">Starting from</p>
            <p className="mt-1 font-display text-4xl">{price.headline}</p>
            {price.sub && <p className="mt-1 text-sm text-stone">{price.sub}</p>}
            {price.minimum && <p className="text-sm text-stone">{price.minimum}</p>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <QuickBookButton car={car.slug} href={`/booking?${carry}`} className={buttonClass("primary")}>
                Book this car
              </QuickBookButton>
              <QuickBookButton car={car.slug} href={`/booking?${carry}`} className={buttonClass("outline")}>
                <Calculator className="size-4" aria-hidden="true" /> Estimate price
              </QuickBookButton>
            </div>
          </div>

          <div className="mt-4">
            <AvailabilityChecker slug={car.slug} />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-sand py-16 lg:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            {highlights.length > 0 && (
              <>
                <h2 className="text-3xl">Why couples choose it</h2>
                <ul className="mt-6 space-y-3">
                  {highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-sm text-charcoal">
                      <Check className="mt-0.5 size-4 shrink-0 text-champagne-deep" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {decorations.length > 0 && (
              <>
                <h2 className="mt-12 text-3xl">Decoration options</h2>
                <dl className="mt-4 border-t border-line">
                  {decorations.map((d) => (
                    <Row key={d.id} label={d.name} note={d.description} value={formatINR(d.price)} />
                  ))}
                </dl>
              </>
            )}
          </div>

          <div className="lg:col-span-7">
            <h2 className="text-3xl">Rental terms & rates</h2>
            {p ? (
              <dl className="mt-4 border-t border-line">
                <Row label="Pricing model" value={{ PACKAGE: "Package (base + extras)", PER_KM: "Per kilometre", HOURLY: "Hourly" }[p.pricingMode] || p.pricingMode} />
                {p.baseFare > 0 && <Row label="Base fare" value={formatINR(p.baseFare)} note={[p.includedHours && `Includes ${p.includedHours} hours`, p.includedKm && `${p.includedKm} km`].filter(Boolean).join(" · ") || null} />}
                {p.extraKmRate > 0 && <Row label={p.includedKm ? "Extra kilometre" : "Per kilometre"} value={`${formatINR(p.extraKmRate)}/km`} />}
                {p.extraHourRate > 0 && <Row label={p.includedHours ? "Extra hour (incl. waiting)" : "Per hour (incl. waiting)"} value={`${formatINR(p.extraHourRate)}/hr`} />}
                {p.waitingChargePerHour > 0 && <Row label="Waiting charges" value={`${formatINR(p.waitingChargePerHour)}/hr`} note={p.freeWaitingMinutes ? `First ${p.freeWaitingMinutes} minutes free` : null} />}
                {p.minimumFare > 0 && <Row label="Minimum booking amount" value={formatINR(p.minimumFare)} />}
                {p.minimumKm > 0 && <Row label="Minimum kilometres" value={`${p.minimumKm} km`} />}
                {p.minimumHours > 0 && <Row label="Minimum hours" value={`${p.minimumHours} hrs`} />}
                {p.driverAllowancePerDay > 0 && <Row label="Chauffeur allowance" value={`${formatINR(p.driverAllowancePerDay)}/day`} />}
                {p.nightCharge > 0 && <Row label="Night charge" value={formatINR(p.nightCharge)} note={`If service runs between ${p.nightStartHour}:00 and ${p.nightEndHour}:00`} />}
                {p.outstationPerDayCharge > 0 ? (
                  <Row label="Outstation charge" value={`${formatINR(p.outstationPerDayCharge)}/day`} note={p.outstationMinKmPerDay ? `Minimum ${p.outstationMinKmPerDay} km per day` : null} />
                ) : (
                  <Row label="Outstation travel" value="Not offered" />
                )}
                <Row label="Tolls" value="At actuals" note={p.tollPolicy} />
                <Row label="Parking" value="At actuals" note={p.parkingPolicy} />
              </dl>
            ) : (
              <p className="mt-4 text-stone">Rates for this car are available on request.</p>
            )}
            {p?.terms && <p className="mt-4 text-sm text-charcoal">{p.terms}</p>}
            <Notice className="mt-6">{PRICE_DISCLAIMER}</Notice>
            {car.isDemo && <p className="mt-3 text-xs text-stone">Sample rates for demonstration — not live business pricing.</p>}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow text-champagne-deep">Questions about this car?</p>
            <h2 className="mt-3 text-4xl">Send an enquiry</h2>
            <p className="mt-4 text-sm leading-relaxed text-stone">
              Ask about colours, décor, timings or a custom itinerary. For an instant estimate, use the{" "}
              <Link href={`/booking?${carry}`} className="text-ink underline decoration-champagne underline-offset-4">price calculator</Link>.
            </p>
          </div>
          <div className="lg:col-span-8">
            <EnquiryForm source="car" carSlug={car.slug} defaultSubject={`Enquiry: ${name}`} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-sand py-16 lg:py-24">
          <div className="container-x">
            <h2 className="text-4xl">More {car.category.name.toLowerCase()}</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <CarCard key={r.id} car={r} />
              ))}
            </div>
          </div>
        </section>
      )}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </>
  );
}
