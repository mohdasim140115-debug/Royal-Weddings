import Link from "next/link";
import { Check } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatINR } from "@/lib/format";

const SERVICE_FOR_BOOKING = { PHOTOGRAPHY: "PHOTOGRAPHY", PRE_WEDDING: "PHOTOGRAPHY", VIDEOGRAPHY: "VIDEOGRAPHY", PHOTO_VIDEO: "PHOTOGRAPHY" };

export default function PhotoPackageCard({ pkg, featured = false }) {
  const specs = [
    pkg.photographers ? `${pkg.photographers} photographer${pkg.photographers > 1 ? "s" : ""}` : null,
    pkg.videographers ? `${pkg.videographers} cinematographer${pkg.videographers > 1 ? "s" : ""}` : null,
    `${pkg.hours} hours${pkg.eventDays > 1 ? ` × ${pkg.eventDays} days` : ""}`,
    pkg.editedPhotos ? `${pkg.editedPhotos} edited photographs` : null,
    pkg.videoDuration,
    pkg.reels ? `${pkg.reels} reel${pkg.reels > 1 ? "s" : ""}` : null,
    pkg.album,
    pkg.deliveryDays ? `Delivery in about ${pkg.deliveryDays} days` : null,
  ].filter(Boolean);
  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];
  const priced = !pkg.quoteOnly && pkg.price != null;

  return (
    <article className={`flex flex-col border p-7 ${featured ? "border-ink bg-ink text-ivory" : "border-line bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`eyebrow text-[0.62rem] ${featured ? "text-champagne" : "text-champagne-deep"}`}>{pkg.tier}</p>
        {pkg.isDemo && <Badge className={featured ? "border-ivory/20 bg-transparent text-ivory/70" : ""}>Sample</Badge>}
      </div>
      <h3 className="mt-3 text-3xl">{pkg.name}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${featured ? "text-ivory/70" : "text-stone"}`}>{pkg.description}</p>
      <p className="mt-6 font-display text-4xl">{priced ? formatINR(pkg.price) : "On request"}</p>
      <p className={`text-xs ${featured ? "text-ivory/60" : "text-stone"}`}>{priced ? "Starting price, before taxes" : "Bespoke quote for your itinerary"}</p>

      <ul className={`mt-6 space-y-2 border-t pt-6 text-sm ${featured ? "border-ivory/15" : "border-line"}`}>
        {[...specs, ...inclusions.filter((i) => !specs.includes(i))].slice(0, 9).map((s) => (
          <li key={s} className="flex gap-3">
            <Check className={`mt-0.5 size-4 shrink-0 ${featured ? "text-champagne" : "text-champagne-deep"}`} aria-hidden="true" />
            {s}
          </li>
        ))}
      </ul>
      {pkg.travelPolicy && <p className={`mt-4 text-xs ${featured ? "text-ivory/55" : "text-stone"}`}>{pkg.travelPolicy}</p>}
      <div className="min-h-6 flex-1" aria-hidden="true" />
      <Link
        href={`/booking?service=${SERVICE_FOR_BOOKING[pkg.serviceType]}&photo=${pkg.slug}`}
        className={`inline-flex min-h-12 items-center justify-center text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-colors ${featured ? "bg-champagne text-ink hover:bg-ivory" : "border border-ink hover:bg-ink hover:text-ivory"}`}
      >
        {priced ? "Book this package" : "Request a quote"}
      </Link>
    </article>
  );
}
