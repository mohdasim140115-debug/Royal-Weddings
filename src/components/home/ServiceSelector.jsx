import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const services = [
  {
    n: "01",
    title: "Wedding Cars",
    body: "Black Defender, Fortuner, Thar, Scorpio-N, Scorpio and Creta — chauffeur-driven and dressed in florals.",
    short: "6 black SUVs with chauffeur and florals.",
    cta: "Explore the fleet",
    href: "/cars",
    image: "/images/cars/fortuner-black.jpg",
    alt: "Black Toyota Fortuner",
  },
  {
    n: "02",
    title: "Photography & Films",
    body: "Traditional, candid and cinematic coverage of every ritual — from mehendi to vidaai.",
    short: "Candid, traditional and cinematic films.",
    cta: "View photography",
    href: "/photography",
    image: "/images/wedding/couple-red-lehenga.jpg",
    alt: "Indian groom in an ivory sherwani and safa with his bride in a red bridal lehenga",
    position: "50% 8%",
  },
  {
    n: "03",
    title: "Complete Packages",
    body: "Car, décor, photography and films in one considered plan with a single estimate.",
    short: "Car, décor and photos in one estimate.",
    cta: "Build a package",
    href: "/wedding-packages",
    image: "/images/wedding/mandap.jpg",
    alt: "An ornate wedding mandap lit by chandeliers",
  },
];

export default function ServiceSelector() {
  return (
    <section aria-labelledby="services-title" className="py-12 sm:py-16 lg:py-24">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Our services" title={<span id="services-title">One concierge, every detail</span>} />
          <p className="hidden max-w-sm text-sm leading-relaxed text-stone sm:block">Book a single car, a photography team, or bring everything together — one contact, one transparent estimate.</p>
        </div>

        {/* Phones: photo-first cards so each service is recognisable at a glance. */}
        <ul className="mt-6 space-y-4 sm:hidden">
          {services.map((s) => (
            <li key={s.n}>
              <Link href={s.href} className="group block overflow-hidden rounded-2xl border border-line/70 bg-white shadow-[0_14px_34px_-20px_rgba(9,36,61,0.5)] transition-transform active:scale-[0.99]">
                <span className="relative block aspect-[16/9] bg-sand">
                  <Image src={s.image} alt={s.alt} fill sizes="100vw" className="object-cover" style={s.position ? { objectPosition: s.position } : undefined} />
                  <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/45 to-transparent" aria-hidden="true" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-[0.14em] text-navy backdrop-blur">{s.n}</span>
                </span>
                <span className="flex items-center gap-3 px-4 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[1.4rem] leading-tight text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-[0.78rem] leading-snug text-stone">{s.short}</span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-ivory transition-transform group-active:translate-x-0.5" aria-hidden="true">
                    <ArrowUpRight className="size-4" />
                  </span>
                </span>
                <span className="sr-only">{s.cta}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Tablet & desktop: tall photo tiles. */}
        <div className="mt-10 hidden gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3">
          {services.map((s) => (
            <Link key={s.n} href={s.href} className="group relative block h-[340px] overflow-hidden bg-ink text-ivory lg:h-[400px]">
              <Image src={s.image} alt={s.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="img-zoom object-cover opacity-85" style={s.position ? { objectPosition: s.position } : undefined} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" aria-hidden="true" />
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-base italic text-champagne">{s.n}</span>
                  <span className="flex size-9 items-center justify-center rounded-full border border-ivory/30 transition-colors duration-500 group-hover:border-champagne group-hover:bg-champagne group-hover:text-ink" aria-hidden="true">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
                <div>
                  <h3 className="text-[1.75rem] leading-tight">{s.title}</h3>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-ivory/70">{s.body}</p>
                  <span className="mt-4 block h-px w-10 bg-champagne transition-all duration-700 group-hover:w-24" aria-hidden="true" />
                  <span className="sr-only">{s.cta}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
