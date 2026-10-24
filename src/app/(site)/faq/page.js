import PageHeader from "@/components/ui/PageHeader";
import { FaqList } from "@/components/home/TrustSection";
import Button from "@/components/ui/Button";
import { faqs } from "@/config/content";

export const metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about wedding car pricing, route distances, included kilometres, tolls, photography packages, payments and cancellations.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently asked questions" crumbs={[{ label: "FAQ" }]} />
      <section className="container-x py-16 lg:py-24">
        <div className="max-w-3xl">
          <FaqList items={faqs} />
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Button href="/contact">Ask us a question</Button>
            <Button href="/booking" variant="outline">Get an estimate</Button>
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
