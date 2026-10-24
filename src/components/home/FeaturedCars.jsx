import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import CarCard from "@/components/cars/CarCard";
import { serviceCategories } from "@/config/content";

export default function FeaturedCars({ cars }) {
  return (
    <section aria-labelledby="fleet-title" className="bg-sand py-16 lg:py-24">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="The fleet" title={<span id="fleet-title">Six black SUVs, one standard</span>} intro="Every car is chauffeur-driven, immaculately prepared and can be dressed in fresh florals." />
          <Link href="/cars" className="group inline-flex items-center gap-3 self-start text-[0.7rem] font-semibold uppercase tracking-[0.18em] lg:self-auto">
            View all cars
            <span className="flex size-9 items-center justify-center rounded-full border border-ink/25 transition-colors group-hover:bg-ink group-hover:text-ivory">
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        </div>

        <nav aria-label="Browse the fleet" className="-mx-4 mt-8 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {serviceCategories.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="inline-flex min-h-9 items-center rounded-full border border-line bg-ivory px-4 text-[0.72rem] text-charcoal transition-colors hover:border-ink hover:bg-ink hover:text-ivory">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {cars.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-stone">Our fleet is being updated. Please contact us for availability.</p>
        )}
      </div>
    </section>
  );
}
