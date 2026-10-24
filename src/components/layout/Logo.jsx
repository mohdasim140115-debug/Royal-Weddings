import { Crown } from "lucide-react";
import { site } from "@/config/site";

/** Crowned monogram + wordmark. Brand name and subtitle come from src/config/site.js. */
export default function Logo({ light = false }) {
  const initials = site.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="relative pt-2.5">
        <Crown className={`absolute left-1/2 top-0 size-3.5 -translate-x-1/2 transition-colors ${light ? "fill-champagne/30 text-champagne" : "fill-champagne/20 text-champagne-deep"}`} strokeWidth={1.5} />
        <span
          className={`flex size-11 items-center justify-center rounded-full border-[1.5px] font-display text-[1.15rem] tracking-tight transition-colors ${
            light ? "border-champagne text-champagne" : "border-champagne-deep/70 text-champagne-deep"
          }`}
        >
          {initials}
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.6rem] tracking-[0.005em] transition-colors ${light ? "text-ivory" : "text-ink"}`}>{site.name}</span>
        <span className={`mt-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.26em] transition-colors ${light ? "text-ivory/75" : "text-stone"}`}>{site.logoSubtitle}</span>
      </span>
    </span>
  );
}
