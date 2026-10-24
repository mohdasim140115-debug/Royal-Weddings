import Image from "next/image";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import PackageBuilder from "@/components/booking/PackageBuilder";
import { loadBookingCatalog } from "@/lib/quote-service";
import { isDate } from "@/lib/validation";

export const metadata = {
  title: "Complete Wedding Packages",
  description: "Combine a chauffeur-driven wedding car, floral décor, photography and films into one package with a live, itemised estimate.",
  alternates: { canonical: "/wedding-packages" },
};

export default async function WeddingPackagesPage({ searchParams }) {
  const sp = await searchParams;
  const catalog = JSON.parse(JSON.stringify(await loadBookingCatalog()));
  const packages = catalog.weddingPackages;

  return (
    <>
      <PageHeader
        eyebrow="Complete wedding packages"
        title="One plan. One estimate. Every detail."
        intro="Start from a curated pairing or build your own — combine cars, décor, photography, films and extras, and watch the estimate update live."
        crumbs={[{ label: "Wedding Packages" }]}
        image="/images/wedding/mandap.jpg"
        imageAlt="An ornate wedding mandap lit by chandeliers"
      />

      <section className="py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="Curated packages" title="Thoughtful starting points" />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {packages.map((p) => (
              <article key={p.id} className="grid overflow-hidden border border-line bg-white sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative aspect-[4/3] bg-sand sm:aspect-auto">
                  {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" className="object-cover" />}
                </div>
                <div className="flex flex-col p-6 sm:p-7">
                  <div className="flex flex-wrap gap-2">
                    {p.quoteOnly && <Badge tone="dark">Bespoke quote</Badge>}
                    {p.bundleDiscountPercent > 0 && <Badge tone="gold">Save {p.bundleDiscountPercent}% on bundle</Badge>}
                    {p.isDemo && <Badge>Sample</Badge>}
                  </div>
                  <h3 className="mt-3 text-3xl">{p.name}</h3>
                  <p className="mt-1 text-sm text-stone">{p.description}</p>
                  <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-champagne-deep">{p.durationText}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {p.inclusions.map((i) => (
                      <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-champagne-deep" aria-hidden="true" />{i}</li>
                    ))}
                  </ul>
                  <ul className="mt-3 space-y-1 text-xs text-stone">
                    {p.exclusions.map((i) => (
                      <li key={i} className="flex gap-2"><Minus className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />Excludes {i.charAt(0).toLowerCase() + i.slice(1)}</li>
                    ))}
                  </ul>
                  <div className="min-h-5 flex-1" aria-hidden="true" />
                  <Link href={`/wedding-packages?package=${p.slug}#builder`} scroll={false} className="mt-4 inline-flex min-h-11 items-center justify-center border border-ink text-[0.72rem] font-semibold uppercase tracking-[0.16em] hover:bg-ink hover:text-ivory">
                    Customise this package
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="builder" aria-labelledby="builder-h" className="scroll-mt-24 border-t border-line bg-sand py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="Package builder" title={<span id="builder-h">Build your celebration</span>} intro="Add or remove anything. Discounts appear only when a package saving or valid coupon applies." />
          <div className="mt-12">
            <PackageBuilder
              key={sp.package || "blank"}
              catalog={catalog}
              initialPackage={typeof sp.package === "string" ? sp.package : null}
              initialTrip={{ date: isDate(sp.date) ? sp.date : "", pickup: typeof sp.pickup === "string" ? sp.pickup.slice(0, 200) : "", venue: typeof sp.venue === "string" ? sp.venue.slice(0, 200) : "", pickupPlace: typeof sp.pickupPlace === "string" ? sp.pickupPlace.slice(0, 40) : null, venuePlace: typeof sp.venuePlace === "string" ? sp.venuePlace.slice(0, 40) : null }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
