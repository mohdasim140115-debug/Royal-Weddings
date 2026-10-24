import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { site } from "@/config/site";

export default function Breadcrumbs({ items, tone = "light" }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: `${site.url}${it.href}` } : {}),
    })),
  };
  const muted = tone === "dark" ? "text-ivory/65 hover:text-ivory" : "text-stone hover:text-ink";
  return (
    <nav aria-label="Breadcrumb" className="text-xs">
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className={`size-3 ${tone === "dark" ? "text-ivory/40" : "text-stone/60"}`} aria-hidden="true" />}
            {it.href && i < all.length - 1 ? (
              <Link href={it.href} className={`transition-colors ${muted}`}>
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className={tone === "dark" ? "text-ivory" : "text-ink"}>
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
