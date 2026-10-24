"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { SlidersHorizontal, Search, LayoutGrid, List, X } from "lucide-react";
import { LUXURY_LABELS } from "@/lib/format";

const SEATS = [3, 4, 6];
const labelCls = "mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-charcoal";
const fieldCls = "field min-h-11 py-2 text-sm";

/**
 * Catalogue layout + filter form. Works without JavaScript (plain GET form);
 * with JS it updates the URL on every change. Results are passed as children.
 */
export default function CarFilters({ filters, categories, makes, budgets, sorts, total, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef(null);
  const [pending, startTransition] = useTransition();
  const [panelOpen, setPanelOpen] = useState(false);

  function apply(extra = {}) {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(formRef.current).entries()) if (v !== "") params.set(k, v);
    for (const [k, v] of Object.entries(extra)) v ? params.set(k, v) : params.delete(k);
    startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }));
  }

  const activeCount =
    ["q", "category", "make", "level", "budget", "date"].filter((k) => filters[k]).length +
    (filters.seats ? 1 : 0) +
    (filters.decorated ? 1 : 0) +
    (filters.chauffeur ? 1 : 0);

  return (
    <form
      ref={formRef}
      action={pathname}
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12"
    >
      <input type="hidden" name="view" value={filters.view} />

      {/* Sidebar */}
      <aside aria-label="Filters" className="lg:sticky lg:top-28 lg:self-start">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          aria-controls="filter-panel"
          className="flex min-h-12 w-full items-center gap-3 border border-line bg-white px-4 text-sm font-semibold lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters {activeCount > 0 && `(${activeCount})`}
        </button>

        <div id="filter-panel" className={`${panelOpen ? "block" : "hidden"} mt-2 border border-line bg-white p-5 lg:mt-0 lg:block lg:p-6`}>
          <div className="grid gap-5">
            <div>
              <label htmlFor="f-category" className={labelCls}>Category</label>
              <select id="f-category" name="category" defaultValue={filters.category} onChange={() => apply()} className={fieldCls}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-make" className={labelCls}>Make</label>
              <select id="f-make" name="make" defaultValue={filters.make} onChange={() => apply()} className={fieldCls}>
                <option value="">All makes</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-level" className={labelCls}>Luxury level</label>
              <select id="f-level" name="level" defaultValue={filters.level} onChange={() => apply()} className={fieldCls}>
                <option value="">Any level</option>
                <option value="luxury">Luxury & ultra-luxury</option>
                {Object.entries(LUXURY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l} only</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-budget" className={labelCls}>Starting budget</label>
              <select id="f-budget" name="budget" defaultValue={filters.budget} onChange={() => apply()} className={fieldCls}>
                <option value="">Any budget</option>
                {budgets.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className={labelCls}>Passengers</legend>
              <div className="flex flex-wrap gap-2">
                {[0, ...SEATS].map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input type="radio" name="seats" value={s || ""} defaultChecked={filters.seats === s} onChange={() => apply()} className="peer sr-only" />
                    <span className="inline-flex min-h-10 min-w-12 items-center justify-center border border-line bg-white px-3 text-sm transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-champagne-deep">
                      {s ? `${s}+` : "Any"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-1">
              <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" name="decorated" value="1" defaultChecked={filters.decorated} onChange={() => apply()} className="size-[18px] accent-[#151515]" />
                Decoration available
              </label>
              <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" name="chauffeur" value="1" defaultChecked={filters.chauffeur} onChange={() => apply()} className="size-[18px] accent-[#151515]" />
                Chauffeur-driven
              </label>
            </div>
            <div className="border-t border-line pt-5">
              <label htmlFor="f-date" className={labelCls}>Event date</label>
              <input id="f-date" type="date" name="date" defaultValue={filters.date} onChange={() => apply()} className={fieldCls} />
              <label className={`mt-3 flex min-h-10 items-center gap-3 text-sm ${filters.date ? "cursor-pointer" : "opacity-50"}`}>
                <input type="checkbox" name="available" value="1" defaultChecked={filters.hideReserved} onChange={() => apply()} className="size-[18px] accent-[#151515]" disabled={!filters.date} />
                Hide cars already reserved
              </label>
              <p className="mt-2 text-xs leading-relaxed text-stone">
                Cars already reserved on your date are marked. All other bookings are confirmed by our team before they are final.
              </p>
            </div>
            <noscript>
              <button type="submit" className="min-h-11 w-full bg-ink text-sm text-ivory">Apply filters</button>
            </noscript>
          </div>
        </div>
      </aside>

      {/* Results column */}
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <label htmlFor="f-q" className="sr-only">Search by make or model</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden="true" />
            <input id="f-q" name="q" type="search" defaultValue={filters.q} placeholder="Search make or model…" className="field pl-11" enterKeyHint="search" />
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="f-sort" className="sr-only">Sort by</label>
            <select id="f-sort" name="sort" defaultValue={filters.sort} onChange={() => apply()} className="field min-h-11 w-full py-2 pr-9 text-sm sm:w-auto">
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="hidden border border-line bg-white sm:flex" role="group" aria-label="Layout">
              <button type="button" onClick={() => apply({ view: "grid" })} aria-pressed={filters.view === "grid"} aria-label="Grid view" className="inline-flex size-11 items-center justify-center aria-pressed:bg-ink aria-pressed:text-ivory">
                <LayoutGrid className="size-4" />
              </button>
              <button type="button" onClick={() => apply({ view: "list" })} aria-pressed={filters.view === "list"} aria-label="List view" className="inline-flex size-11 items-center justify-center aria-pressed:bg-ink aria-pressed:text-ivory">
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex min-h-10 items-center justify-between gap-4 border-b border-line pb-4 text-sm text-stone">
          <p aria-live="polite">
            {pending ? "Updating…" : `${total} ${total === 1 ? "car" : "cars"}`}
            {filters.date && !pending && " · reservations shown for your date"}
          </p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => startTransition(() => router.push(`${pathname}?view=${filters.view}`, { scroll: false }))}
              className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal hover:text-burgundy"
            >
              <X className="size-3.5" aria-hidden="true" /> Clear ({activeCount})
            </button>
          )}
        </div>

        <div className={`mt-8 transition-opacity duration-300 ${pending ? "opacity-50" : ""}`}>{children}</div>
      </div>
    </form>
  );
}
