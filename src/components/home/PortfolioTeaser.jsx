import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const categories = ["Wedding photography", "Candid", "Pre-wedding", "Cinematic films", "Drone*", "Reels", "Albums"];

export default function PortfolioTeaser({ items, isDemo }) {
  const shown = items.slice(0, 4);
  return (
    <section aria-labelledby="portfolio-title" className="bg-ink py-16 text-ivory lg:py-24">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <SectionHeading tone="dark" eyebrow="Photography & films" title={<span id="portfolio-title">Stories told in light</span>} intro="Traditional, candid and cinematic coverage by one coordinated team." />
          <ul className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c} className="rounded-full border border-ivory/15 px-3 py-1 text-[0.72rem] text-ivory/70">{c}</li>
            ))}
          </ul>
          <p className="mt-3 text-[0.68rem] text-ivory/40">* Subject to venue and airspace permissions.</p>
          <Link href="/photography" className="mt-8 inline-flex items-center gap-2 border-b border-champagne pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-champagne hover:text-ivory">
            Explore photography <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-8 lg:grid-cols-4">
          {shown.map((it, i) => (
            <figure key={it.id} className={`group relative overflow-hidden bg-charcoal ${i % 2 === 0 ? "aspect-[3/4]" : "aspect-[3/4] lg:mt-10"}`}>
              <Image src={it.imageUrl} alt={it.alt} fill sizes="(min-width: 1024px) 16vw, 50vw" className="img-zoom object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 text-[0.62rem] uppercase tracking-[0.16em] text-ivory/90">{it.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      {isDemo && <p className="container-x mt-6 text-right text-[0.65rem] text-ivory/40">Representative imagery for preview.</p>}
    </section>
  );
}
