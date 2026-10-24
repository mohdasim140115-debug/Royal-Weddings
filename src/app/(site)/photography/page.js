import PageHeader from "@/components/ui/PageHeader";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import PortfolioGallery from "@/components/photography/PortfolioGallery";
import PhotoPackageCard from "@/components/photography/PhotoPackageCard";
import EnquiryForm from "@/components/cars/EnquiryForm";
import { prisma } from "@/lib/db";
import { photographyServices } from "@/config/content";
import { formatINR } from "@/lib/format";

export const metadata = {
  title: "Wedding Photography & Cinematic Films",
  description: "Traditional and candid wedding photography, cinematic films, pre-wedding shoots, reels, drone coverage and heirloom albums — with transparent packages.",
  alternates: { canonical: "/photography" },
};

const GROUPS = [
  { key: "PHOTOGRAPHY", title: "Photography" },
  { key: "VIDEOGRAPHY", title: "Wedding films" },
  { key: "PHOTO_VIDEO", title: "Photography + films" },
  { key: "PRE_WEDDING", title: "Pre-wedding" },
];

export default async function PhotographyPage() {
  const [packages, portfolio, addOns] = await Promise.all([
    prisma.photoPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.portfolioItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.addOnService.findMany({ where: { isActive: true, category: { in: ["PHOTO", "GENERAL"] } }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Photography & films"
        title="Timeless photographs. Films you'll return to."
        intro="Traditional, candid and cinematic coverage for every ritual — from the first haldi to the final vidaai."
        crumbs={[{ label: "Photography & Films" }]}
        image="/images/wedding/couple-window.jpg"
        imageAlt="Couple embracing in front of tall curtained windows, black and white"
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button href="#packages" variant="gold" size="lg">View packages</Button>
          <Button href="/booking?service=PHOTOGRAPHY" variant="outline-light" size="lg">Check your date</Button>
        </div>
      </PageHeader>

      <section className="py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="What we cover" title="Every chapter of your celebration" />
          <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {photographyServices.map((s) => (
              <div key={s.title} className="bg-ivory p-7">
                <h3 className="text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="portfolio-h" className="border-t border-line bg-sand py-20 lg:py-28">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="Portfolio" title={<span id="portfolio-h">Moments, not poses</span>} />
            {portfolio.some((p) => p.isDemo) && <p className="max-w-sm text-xs text-stone">Representative imagery for preview. Replace with your own work from Admin → Photography.</p>}
          </div>
          <div className="mt-10">
            {portfolio.length ? <PortfolioGallery items={portfolio} /> : <p className="text-stone">Our portfolio is being updated.</p>}
          </div>
        </div>
      </section>

      <section id="packages" aria-labelledby="packages-h" className="scroll-mt-24 py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading
            eyebrow="Packages"
            title={<span id="packages-h">Clear packages, thoughtfully made</span>}
            intro="Every package can be extended with extra hours, extra days and add-ons. Prices exclude taxes and outstation travel."
          />
          {GROUPS.map((g) => {
            const list = packages.filter((p) => p.serviceType === g.key);
            if (!list.length) return null;
            return (
              <div key={g.key} className="mt-16">
                <h3 className="eyebrow border-b border-line pb-4 text-charcoal">{g.title}</h3>
                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => (
                    <PhotoPackageCard key={p.id} pkg={p} featured={p.tier === "Cinematic Signature"} />
                  ))}
                </div>
              </div>
            );
          })}
          {packages.some((p) => p.isDemo) && <p className="mt-8 text-xs text-stone">Sample packages and prices for demonstration — editable in the admin panel.</p>}
        </div>
      </section>

      {addOns.length > 0 && (
        <section className="border-t border-line bg-sand py-20">
          <div className="container-x grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading eyebrow="Add-ons" title="Tailor your coverage" />
            </div>
            <ul className="divide-y divide-line border-y border-line lg:col-span-8">
              {addOns.map((a) => (
                <li key={a.id} className="flex flex-col justify-between gap-2 py-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-display text-xl">{a.name}</p>
                    <p className="text-sm text-stone">{a.description}</p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums">
                    {formatINR(a.price)}
                    {{ PER_DAY: " / day", PER_HOUR: " / hour", PER_UNIT: " each", FLAT: "" }[a.unit]}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="py-20 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Enquire" title="Tell us about your events" intro="Share your dates, venues and the rituals you'd like covered. We'll reply with crew availability and a tailored proposal." />
          </div>
          <div className="lg:col-span-8">
            <EnquiryForm source="photography" defaultSubject="Photography & films enquiry" />
          </div>
        </div>
      </section>
    </>
  );
}
