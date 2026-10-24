import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { bookingSteps } from "@/config/content";

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="py-16 lg:py-24">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="How it works" title={<span id="how-title">Four calm steps</span>} />
          <Link href="/booking" className="group inline-flex items-center gap-2 self-start text-[0.7rem] font-semibold uppercase tracking-[0.18em] lg:self-auto">
            Start a booking <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
        <ol className="relative mt-8 grid grid-cols-2 gap-x-5 gap-y-7 lg:mt-10 lg:grid-cols-4 lg:gap-6">
          <span className="absolute left-0 right-0 top-[18px] hidden h-px bg-line lg:block" aria-hidden="true" />
          {bookingSteps.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="relative flex size-9 items-center justify-center rounded-full border border-champagne bg-ivory font-display text-base italic text-champagne-deep" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-1.5 text-[0.85rem] leading-relaxed text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
