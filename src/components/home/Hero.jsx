import Image from "next/image";
import { site } from "@/config/site";
import HeroSearch from "./HeroSearch";
import ServiceTiles from "./ServiceTiles";

export default function Hero({ cars = [] }) {
  const { hero } = site;
  return (
    <section aria-labelledby="hero-title" className="relative bg-ink text-ivory">
      {/* Full-bleed photo with a dark wash so the cards and text stay readable. */}
      <div className="absolute inset-0 overflow-hidden">
        <Image src={hero.image} alt={hero.imageAlt} fill priority sizes="100vw" className="scale-105 object-cover object-[50%_45%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/55 to-ink/85 sm:from-ink/80 sm:via-ink/40" aria-hidden="true" />
      </div>

      <div className="container-x relative pb-8 pt-20 sm:pt-24 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="animate-rise text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] sm:text-[0.72rem] sm:tracking-[0.4em]">
            Mewat · Wedding Car Rental
          </p>
          {/* Visible on phones; on larger screens the cards are the hero and the heading stays for search engines. */}
          <h1 id="hero-title" className="mt-2.5 font-display text-[1.95rem] font-semibold leading-[1.1] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.75)] sm:sr-only">
            Baraat ke liye Car Booking
            <span className="mt-2 flex items-center justify-center gap-1.5 font-sans text-[0.9rem] font-medium leading-snug [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
              Mewat mein
              <span className="rounded-full bg-navy px-2.5 py-0.5 text-[0.82rem] font-semibold text-white ring-1 ring-white/30 [text-shadow:none]">sabse kam price</span>
              par
            </span>
          </h1>
        </div>

        <div className="mx-auto mt-5 max-w-4xl lg:mt-6">
          <ServiceTiles cars={cars} />
        </div>

      </div>

      <div className="container-x relative z-10 hidden lg:block">
        <div className="-mt-[60px]">
          <HeroSearch cars={cars} />
        </div>
      </div>
    </section>
  );
}
