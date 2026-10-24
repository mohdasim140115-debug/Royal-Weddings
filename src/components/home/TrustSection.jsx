import Link from "next/link";
import { ShieldCheck, Route, FileCheck2, ReceiptText, Plus, MessageCircle, Star, ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { assurances, faqs } from "@/config/content";
import { site, whatsappLink } from "@/config/site";

const icons = [ReceiptText, Route, FileCheck2, ShieldCheck];

export function FaqList({ items }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left font-display text-[1.15rem] leading-snug marker:hidden [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus className="size-4 shrink-0 text-champagne-deep transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p className="pb-5 pr-10 text-[0.85rem] leading-relaxed text-stone">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export default function TrustSection({ reviews = [], locations = [] }) {
  const wa = whatsappLink(`Hello ${site.name}, I'd like to plan my wedding transport and photography.`);
  return (
    <>
      {/* Assurances — one slim row */}
      <section aria-label="Why book with us" className="border-y border-line">
        <ul className="container-x grid divide-line sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
          {assurances.map((a, i) => {
            const Icon = icons[i];
            return (
              <li key={a.title} className="flex gap-4 py-7 lg:px-6 lg:first:pl-0 lg:last:pr-0">
                <Icon className="mt-0.5 size-5 shrink-0 text-champagne-deep" strokeWidth={1.25} aria-hidden="true" />
                <div>
                  <h3 className="font-sans text-[0.8rem] font-semibold tracking-[0.02em]">{a.title}</h3>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-stone">{a.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {reviews.length > 0 && (
        <section aria-label="Reviews" className="py-16">
          <div className="container-x grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="border border-line bg-white p-6">
                <div className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-champagne text-champagne" : "text-line"}`} aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-3 font-display text-lg leading-snug">“{r.text}”</blockquote>
                <figcaption className="mt-3 text-[0.65rem] uppercase tracking-[0.16em] text-stone">{r.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="py-16 lg:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Questions" title={<span id="faq-title">Before you book</span>} />
            <p className="mt-4 text-[0.85rem] leading-relaxed text-stone">
              See our{" "}
              <Link href="/cancellation-policy" className="text-ink underline decoration-champagne underline-offset-4">cancellation policy</Link> and{" "}
              <Link href="/terms" className="text-ink underline decoration-champagne underline-offset-4">terms</Link>.
            </p>
            <Link href="/faq" className="group mt-6 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
              All questions <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={faqs.slice(0, 5)} />
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="contact-band-title" className="container-x pb-16 lg:pb-24">
        <div className="relative overflow-hidden bg-burgundy px-6 py-10 text-ivory sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-14 lg:py-12">
          <span className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full border border-champagne/20" aria-hidden="true" />
          <span className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full border border-champagne/15" aria-hidden="true" />
          <div className="relative">
            <p className="eyebrow text-champagne-soft">Speak with a planner</p>
            <h2 id="contact-band-title" className="mt-3 text-[2rem] leading-tight sm:text-[2.4rem]">Tell us about your celebration.</h2>
            <p className="mt-2 max-w-lg text-[0.88rem] text-ivory/70">
              {locations.length > 0
                ? `Serving ${locations.map((l) => l.city).join(", ")} — and destination weddings by arrangement.`
                : "Share your venue and dates — we will confirm availability and a tailored quote."}
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Button href="/contact" variant="gold">Send an enquiry</Button>
            {wa && (
              <Button href={wa} variant="outline-light">
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
