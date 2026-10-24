"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** "Choose your perfect wedding car" — a scrollable row of the fleet under the hero. */
export default function CarTypeStrip({ cars }) {
  const rail = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });

  if (!cars.length) return null;
  return (
    <section aria-labelledby="choose-title" className="bg-white pb-12 pt-12 lg:pt-14">
      <div className="container-x">
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-px w-8 bg-champagne" />
            <span className="size-1.5 rotate-45 bg-champagne" />
            <span className="h-px w-8 bg-champagne" />
          </span>
          <h2 id="choose-title" className="mt-3 flex items-center gap-4 text-center font-sans text-[0.8rem] font-semibold uppercase tracking-[0.3em] text-ink">
            <span className="hidden h-px w-10 bg-champagne sm:block" aria-hidden="true" />
            Choose your perfect wedding car
          </h2>
        </div>

        <div className="relative mt-8">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={edges.start}
            aria-label="Previous cars"
            className="absolute -left-3 top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_6px_20px_-6px_rgba(0,0,0,0.25)] transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:flex lg:-left-6"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>

          <ul ref={rail} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none">
            {cars.map((c) => (
              <li key={c.slug} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[calc((100%-5*1rem)/6)]">
                <Link href={`/cars/${c.slug}`} className="group block overflow-hidden rounded-xl border border-line/70 bg-sand/40 transition-all duration-300 hover:-translate-y-1 hover:border-champagne/60 hover:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.35)]">
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    {c.images?.[0] ? (
                      <Image src={c.images[0].url} alt={c.images[0].alt || `${c.make} ${c.model}`} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 44vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <span className="absolute inset-0 bg-sand" />
                    )}
                  </span>
                  <span className="block px-3 py-3 text-center">
                    <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-champagne-deep">{c.make}</span>
                    <span className="mt-0.5 block text-[0.95rem] font-medium text-ink">{c.model}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={edges.end}
            aria-label="More cars"
            className="absolute -right-3 top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_6px_20px_-6px_rgba(0,0,0,0.25)] transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:flex lg:-right-6"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
