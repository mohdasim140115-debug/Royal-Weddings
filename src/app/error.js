"use client";

import Link from "next/link";

export default function Error({ reset }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow text-champagne-deep">Something went wrong</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">We hit an unexpected bump</h1>
      <p className="mt-4 max-w-md text-stone">Please try again. If the problem continues, contact us and we will help right away.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => reset()} className="inline-flex min-h-12 items-center justify-center bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory">Try again</button>
        <Link href="/contact" className="inline-flex min-h-12 items-center justify-center border border-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em]">Contact us</Link>
      </div>
    </div>
  );
}
