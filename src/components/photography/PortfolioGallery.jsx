"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const LABELS = { all: "All", wedding: "Weddings", candid: "Candid", "pre-wedding": "Pre-wedding", films: "Films", drone: "Drone", reels: "Reels", albums: "Albums" };

export default function PortfolioGallery({ items }) {
  const cats = ["all", ...Array.from(new Set(items.map((i) => i.category)))];
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(-1);
  const dialogRef = useRef(null);
  const shown = cat === "all" ? items : items.filter((i) => i.category === cat);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open >= 0 && !d.open) d.showModal();
    if (open < 0 && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (open < 0) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % shown.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + shown.length) % shown.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shown.length]);

  const current = shown[open];

  return (
    <div>
      <div role="tablist" aria-label="Portfolio categories" className="-mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        {cats.map((c) => (
          <button
            key={c}
            role="tab"
            type="button"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className="min-h-11 shrink-0 border-b-2 border-transparent px-4 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-stone transition-colors hover:text-ink aria-selected:border-champagne aria-selected:text-ink"
          >
            {LABELS[c] || c}
          </button>
        ))}
      </div>

      <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
        {shown.map((it, i) => (
          <li key={it.id} className="break-inside-avoid">
            <button type="button" onClick={() => setOpen(i)} className="group relative block w-full overflow-hidden bg-sand" aria-label={`Open ${it.title}`}>
              <Image src={it.imageUrl} alt={it.alt} width={900} height={i % 3 === 0 ? 1200 : 700} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="img-zoom h-auto w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink/75 to-transparent p-4 text-left text-xs uppercase tracking-[0.16em] text-ivory opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                {it.title}
                <span className="text-ivory/70">{LABELS[it.category] || it.category}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} onClose={() => setOpen(-1)} className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-ivory backdrop:bg-ink/80" aria-label={current?.title || "Photo"}>
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 sm:px-8">
              <p className="text-xs uppercase tracking-[0.18em] text-ivory/70">
                {current.title} · {open + 1} / {shown.length}
              </p>
              <button type="button" onClick={() => setOpen(-1)} className="inline-flex size-11 items-center justify-center" aria-label="Close">
                <X className="size-6" />
              </button>
            </div>
            <div className="relative flex-1">
              <Image src={current.imageUrl} alt={current.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="flex justify-center gap-3 p-4">
              <button type="button" onClick={() => setOpen((i) => (i - 1 + shown.length) % shown.length)} className="inline-flex size-12 items-center justify-center border border-ivory/30" aria-label="Previous photo">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => setOpen((i) => (i + 1) % shown.length)} className="inline-flex size-12 items-center justify-center border border-ivory/30" aria-label="Next photo">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
