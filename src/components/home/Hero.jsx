import Image from "next/image";
import Link from "next/link";
import { Car, Flower2, UserRound, ArrowRight, Play } from "lucide-react";
import { site } from "@/config/site";
import HeroSearch from "./HeroSearch";

const FEATURES = [
  { icon: Car, line1: "Sabse Kam", line2: "Price" },
  { icon: Flower2, line1: "Phoolon ki", line2: "Decoration" },
  { icon: UserRound, line1: "Professional", line2: "Chauffeur" },
];

export default function Hero({ cars = [] }) {
  const { hero } = site;
  return (
    <section aria-labelledby="hero-title" className="relative bg-ink text-ivory">
      <div className="relative overflow-hidden ">
        {/* Photograph: a band on mobile; full-bleed on desktop with the car on the right. */}
        <div className="relative h-[44vh] max-h-[400px] min-h-[280px] lg:absolute lg:inset-y-0 lg:left-[36%] lg:right-0 lg:h-auto lg:max-h-none">
          <Image src={hero.image} alt={hero.imageAlt} fill priority sizes="(min-width: 1024px) 64vw, 100vw" className="object-cover object-[45%_65%] lg:object-[40%_70%]" />
          {/* Warm dusk tint + readable left side */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a1a10]/30 via-transparent to-[#3b2414]/25 mix-blend-multiply" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/50 lg:bg-gradient-to-r lg:from-ink lg:via-ink/10 lg:to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 hidden h-48 bg-gradient-to-t from-ink/80 to-transparent lg:block" aria-hidden="true" />
          {hero.imageCredit && (
            <p className="absolute bottom-16 right-4 text-[0.55rem] tracking-[0.04em] text-ivory/55 lg:bottom-32">{hero.imageCredit}</p>
          )}
        </div>

        <div className="container-x relative -mt-14 pb-10 lg:mt-0 lg:flex lg:min-h-[min(86vh,740px)] lg:items-center lg:pb-28 lg:pt-32">
          <div className="max-w-[36rem]">
            <p className="animate-rise flex items-center gap-3 whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-[0.26em] text-ivory/90 sm:gap-4 sm:text-[0.72rem] sm:tracking-[0.42em]">
              Mewat · Wedding Car Rental
              <span className="h-px w-12 bg-champagne" aria-hidden="true" />
            </p>
            <h1 id="hero-title" className="animate-rise-delay mt-5 font-display leading-[1.02]">
              <span className="block text-[2.5rem] font-medium sm:text-5xl lg:text-[3.9rem]">Baraat ke liye</span>
              <span className="mt-1 block text-[2.8rem] italic text-champagne sm:text-[3.4rem] lg:text-[4.4rem]">Man Pasand Car</span>
            </h1>
            <p className="animate-rise-delay-2 mt-6 max-w-md text-[1.02rem] leading-relaxed text-ivory/85 lg:text-[1.15rem]">
              Mewat mein sabse kam price par apni man pasand car book karein — decoration, chauffeur aur saari service ek saath.
            </p>

            <ul className="animate-rise-delay-2 mt-7 grid grid-cols-3 gap-3 sm:flex sm:gap-5">
              {FEATURES.map(({ icon: Icon, line1, line2 }, i) => (
                <li key={line1} className={`flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 ${i > 0 ? "sm:border-l sm:border-ivory/20 sm:pl-5" : ""}`}>
                  <span className="flex size-11 shrink-0 sm:size-12 items-center justify-center rounded-full border border-champagne/80 bg-ink/40 text-champagne">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="text-[0.78rem] leading-snug text-ivory/90 sm:text-[0.88rem]">
                    {line1}
                    <br />
                    {line2}
                  </span>
                </li>
              ))}
            </ul>

            <div className="animate-rise-delay-2 mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/cars"
                className="inline-flex min-h-14 items-center gap-3 rounded-md bg-champagne px-7 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-ink shadow-[0_10px_30px_-12px_rgba(197,164,109,0.9)] transition-colors hover:bg-champagne-soft"
              >
                Explore Wedding Cars <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              {hero.videoUrl && (
                <a href={hero.videoUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-[0.8rem] font-semibold uppercase tracking-[0.16em]">
                  <span className="flex size-12 items-center justify-center rounded-full border-2 border-ivory transition-colors group-hover:border-champagne group-hover:text-champagne">
                    <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />
                  </span>
                  Watch Video
                </a>
              )}
            </div>
          </div>

          <div className="mt-10 lg:hidden">
            <HeroSearch cars={cars} idPrefix="hs-m" />
          </div>
        </div>
      </div>

      <div className="container-x relative z-10 hidden lg:block">
        <div className="-mt-[68px]">
          <HeroSearch cars={cars} />
        </div>
      </div>
    </section>
  );
}
