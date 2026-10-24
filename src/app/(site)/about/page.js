import Image from "next/image";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { assurances } from "@/config/content";
import { site } from "@/config/site";

export const metadata = {
  title: "About Us",
  description: `${site.name} brings wedding cars, décor, photography and films together under one concierge — with transparent pricing and written confirmation.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="A wedding concierge for arrivals and memories"
        intro="We bring together the cars that carry you and the people who capture you — so your day feels effortless and looks unforgettable."
        crumbs={[{ label: "About Us" }]}
        image="/images/wedding/couple-monochrome.jpg"
        imageAlt="Black and white photograph of a couple embracing, the veil caught by the wind"
      />

      <section className="py-20 lg:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden lg:col-span-5">
            <Image src="/images/cars/land-rover-defender-black-street.jpg" alt="Black Land Rover Defender parked outside a building" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <SectionHeading eyebrow="Our approach" title="Calm planning, honest pricing, beautiful execution" />
            <div className="mt-6 space-y-5 text-base leading-relaxed text-charcoal">
              <p>
                Weddings involve dozens of moving parts. Our role is to make two of the most visible ones — how you arrive and how your day is remembered — simple to plan and easy to trust.
              </p>
              <p>
                Every estimate on this website is calculated from published rates and, where enabled, the real driving route. Nothing is final until we have checked availability and confirmed it with you in writing.
              </p>
              <p className="border-l-2 border-champagne pl-5 text-sm text-stone">
                {/* Replace with your story: founding year, fleet size, team and service areas — only verifiable facts. */}
                Our story, team and service areas will be shared here soon.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/cars">Explore the fleet</Button>
              <Button href="/contact" variant="outline">Speak with us</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-sand py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="What we promise" title="Principles we work by" />
          <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {assurances.map((a) => (
              <div key={a.title} className="bg-sand p-8">
                <h3 className="text-2xl">{a.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
