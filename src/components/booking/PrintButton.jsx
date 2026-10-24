"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory">
      <Printer className="size-4" aria-hidden="true" /> Print or save as PDF
    </button>
  );
}
