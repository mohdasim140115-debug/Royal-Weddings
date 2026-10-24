import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import CarCard from "@/components/cars/CarCard";
import CarFilters from "@/components/cars/CarFilters";
import { parseFilters, searchCars, getFilterOptions, BUDGETS, SORTS } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Black Wedding SUVs — Thar, Scorpio, Fortuner, Creta & Defender",
  description: "Chauffeur-driven black wedding SUVs: Mahindra Thar, Scorpio, Scorpio-N, Toyota Fortuner, Hyundai Creta and Land Rover Defender. Compare rates, seats and decoration options.",
  alternates: { canonical: "/cars" },
};

function pageHref(sp, page) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v && k !== "page") params.set(k, v);
  if (page > 1) params.set("page", String(page));
  return `/cars?${params}`;
}

export default async function CarsPage({ searchParams }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [{ cars, total, pages, page, reserved }, options] = await Promise.all([searchCars(filters), getFilterOptions()]);

  // Carry trip details from the homepage search into "Book".
  const carry = new URLSearchParams();
  for (const k of ["pickup", "venue", "pickupPlace", "venuePlace", "date"]) if (typeof sp[k] === "string" && sp[k]) carry.set(k, sp[k]);

  const heading = filters.level === "luxury" ? "Luxury wedding SUVs" : "Black wedding SUVs";

  return (
    <>
      <PageHeader
        eyebrow="The fleet"
        title={heading}
        intro="Every car is chauffeur-driven with transparent, published rates. Pick a date to see which cars are already reserved."
        crumbs={[{ label: "Wedding Cars", href: "/cars" }]}
      >
        {filters.date && (
          <p className="mt-6 inline-flex border border-line bg-ivory px-4 py-2 text-sm">
            Showing reservations for <strong className="ml-1 font-semibold">{formatDate(filters.date)}</strong>
          </p>
        )}
      </PageHeader>

      <section className="container-x py-12 lg:py-16">
        <CarFilters
          key={JSON.stringify(filters)}
          filters={filters}
          categories={options.categories}
          makes={options.makes}
          budgets={BUDGETS.map(({ value, label }) => ({ value, label }))}
          sorts={SORTS}
          total={total}
        >
          {cars.length === 0 ? (
            <div className="border border-dashed border-line bg-sand/50 px-6 py-16 text-center">
              <p className="font-display text-3xl">No cars match these filters</p>
              <p className="mt-3 text-sm text-stone">Try removing a filter, or tell us what you need and we will source it.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/cars" className="inline-flex min-h-11 items-center border border-ink px-5 text-xs font-semibold uppercase tracking-[0.14em]">
                  Clear filters
                </Link>
                <Link href="/contact" className="inline-flex min-h-11 items-center bg-ink px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                  Request a car
                </Link>
              </div>
            </div>
          ) : (
            <div className={filters.view === "list" ? "grid gap-6" : "grid gap-6 sm:grid-cols-2 2xl:grid-cols-3"}>
              {cars.map((car, i) => (
                <CarCard
                  key={car.id}
                  car={car}
                  layout={filters.view}
                  priority={i < 2}
                  bookingQuery={carry.toString()}
                  availability={filters.date ? (reserved.has(car.id) ? "RESERVED" : "ON_REQUEST") : undefined}
                />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(sp, p)}
                  aria-current={p === page ? "page" : undefined}
                  className="inline-flex size-11 items-center justify-center border border-line text-sm transition-colors hover:border-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-ivory"
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </CarFilters>
      </section>
    </>
  );
}
