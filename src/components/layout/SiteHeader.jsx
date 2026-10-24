"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, UserRound, ArrowUpRight, ArrowRight, Phone } from "lucide-react";
import { navigation, site, whatsappLink } from "@/config/site";
import Logo from "./Logo";

// Routes that open with a dark, full-bleed hero — the header starts transparent there.
const DARK_HERO = ["/", "/photography", "/wedding-packages", "/about"];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const overHero = DARK_HERO.includes(pathname) && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href) => {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname.startsWith(path) && !href.includes("?");
  };

  const wa = whatsappLink(`Hello ${site.name}, I'd like to enquire about a wedding booking.`);

  return (
    <>
      <a href="#main" className="sr-only z-[60] bg-ink px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[var(--ease-luxe)] ${
          overHero ? "bg-gradient-to-b from-ink/70 to-transparent text-ivory" : "border-b border-line/80 bg-ivory/95 text-ink backdrop-blur-md"
        }`}
      >
        <div className="container-x flex h-[76px] items-center justify-between gap-6 lg:h-24">
          <Link href="/" aria-label={`${site.name} — home`} className="shrink-0">
            <Logo light={overHero} />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-6 xl:gap-9">
              {navigation
                .filter((n) => n.desktop !== false)
                .map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={isActive(n.href) ? "page" : undefined}
                      className={`relative py-2 text-[0.9rem] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-1.5 after:h-[2px] after:origin-left after:scale-x-0 after:bg-champagne after:transition-transform after:duration-500 hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 ${
                        overHero ? "text-ivory/85 hover:text-ivory" : "text-charcoal hover:text-ink"
                      }`}
                    >
                      {n.short}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/account"
              aria-label="My account"
              className={`hidden size-11 items-center justify-center transition-colors sm:inline-flex ${overHero ? "text-ivory/85 hover:text-ivory" : "text-charcoal hover:text-ink"}`}
            >
              <UserRound className="size-[18px]" strokeWidth={1.5} />
            </Link>
            {site.contact.phone && (
              <a
                href={`tel:${site.contact.phone.replace(/s/g, "")}`}
                className={`hidden min-h-12 items-center gap-2.5 rounded-md border px-4 text-[0.9rem] font-medium transition-colors xl:inline-flex ${
                  overHero ? "border-ivory/70 text-ivory hover:bg-ivory/10" : "border-ink/25 text-ink hover:border-ink"
                }`}
              >
                <Phone className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {site.contact.phone}
              </a>
            )}
            <Link
              href="/booking"
              className="hidden min-h-12 items-center gap-2.5 rounded-md bg-champagne px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink shadow-[0_8px_24px_-12px_rgba(184,147,90,0.8)] transition-colors hover:bg-champagne-soft sm:inline-flex"
            >
              Book Now <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              className="inline-flex size-11 items-center justify-center lg:hidden"
            >
              <Menu className="size-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed inset-0 z-[55] bg-ink text-ivory transition-opacity duration-500 lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <div className="container-x flex h-[72px] items-center justify-between">
          <Logo light />
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex size-11 items-center justify-center">
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </div>
        <nav aria-label="Mobile" className="container-x mt-6 flex h-[calc(100dvh-96px)] flex-col overflow-y-auto pb-10">
          <ul className="divide-y divide-ivory/10 border-y border-ivory/10">
            {navigation.map((n, i) => (
              <li key={n.href} style={{ transitionDelay: open ? `${80 + i * 35}ms` : "0ms" }} className={`transition-all duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                <Link href={n.href} className="flex min-h-14 items-center justify-between py-3 font-display text-[1.75rem] leading-tight">
                  {n.label}
                  <ArrowUpRight className="size-5 text-champagne" strokeWidth={1.25} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/booking" className="inline-flex min-h-13 items-center justify-center bg-champagne px-6 py-4 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-ink">
              Book Now
            </Link>
            <Link href="/account" className="inline-flex min-h-13 items-center justify-center border border-ivory/30 px-6 py-4 text-[0.78rem] font-semibold uppercase tracking-[0.16em]">
              My Account
            </Link>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-6 text-sm text-ivory/70 underline-offset-4 hover:underline">
              Chat with us on WhatsApp
            </a>
          )}
        </nav>
      </div>
    </>
  );
}
