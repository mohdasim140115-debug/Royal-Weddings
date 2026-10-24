import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

export default function PackagesTeaser({ packages }) {
  if (!packages.length) return null;
  return (
    <section aria-labelledby="packages-title" className="bg-sand py-16 lg:py-24">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Wedding packages" title={<span id="packages-title">Curated pairings</span>} intro="Start from a considered combination, then change anything in the builder." />
          <Link href="/wedding-packages#builder" className="group inline-flex items-center gap-2 self-start text-[0.7rem] font-semibold uppercase tracking-[0.18em] lg:self-auto">
            Open the builder <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
          {packages.map((p) => (
            <Link key={p.id} href={`/wedding-packages?package=${p.slug}#builder`} className="group flex flex-col overflow-hidden border border-line/80 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
              <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="img-zoom object-cover" />}
                {p.quoteOnly && <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ivory">Bespoke quote</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-champagne-deep">{p.durationText}</p>
                <h3 className="mt-1.5 text-2xl">{p.name}</h3>
                <p className="mt-1 text-[0.82rem] text-stone">{p.tagline}</p>
                <ul className="mt-4 space-y-1.5">
                  {(p.inclusions || []).slice(0, 3).map((inc) => (
                    <li key={inc} className="flex gap-2 text-[0.8rem] text-charcoal">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-champagne-deep" aria-hidden="true" />
                      {inc}
                    </li>
                  ))}
                </ul>
                <div className="min-h-4 flex-1" aria-hidden="true" />
                <span className="mt-4 inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink">
                  Customise & price <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
