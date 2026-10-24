import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const services = [
  {
    n: "01",
    title: "Wedding Cars",
    body: "Black Defender, Fortuner, Thar, Scorpio-N, Scorpio and Creta — chauffeur-driven and dressed in florals.",
    cta: "Explore the fleet",
    href: "/cars",
    image: "/images/cars/toyota-fortuner-black-side.jpg",
    alt: "Black Toyota Fortuner parked on a street",
  },
  {
    n: "02",
    title: "Photography & Films",
    body: "Traditional, candid and cinematic coverage of every ritual — from mehendi to vidaai.",
    cta: "View photography",
    href: "/photography",
    image: "/images/wedding/bridal-portrait.jpg",
    alt: "Bride in a pink silk saree and gold jewellery, photographed in a garden",
    position: "50% 25%",
  },
  {
    n: "03",
    title: "Complete Packages",
    body: "Car, décor, photography and films in one considered plan with a single estimate.",
    cta: "Build a package",
    href: "/wedding-packages",
    image: "/images/wedding/mandap.jpg",
    alt: "An ornate wedding mandap lit by chandeliers",
  },
];

export default function ServiceSelector() {
  return (
    <section aria-labelledby="services-title" className="py-16 lg:py-24">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Our services" title={<span id="services-title">One concierge, every detail</span>} />
          <p className="max-w-sm text-sm leading-relaxed text-stone">Book a single car, a photography team, or bring everything together — one contact, one transparent estimate.</p>
        </div>

        <div className="rail mt-8 sm:mt-10 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
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
