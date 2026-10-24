"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, UserRound, ArrowRight, Phone, House, CarFront, Gem, Camera, Gift, Info, MessageCircle, ChevronRight } from "lucide-react";
import { navigation, site, whatsappLink } from "@/config/site";
import Logo from "./Logo";
import QuickBookModal from "@/components/booking/QuickBookModal";
import { openQuickBook, QUICK_BOOK_EVENT } from "@/components/booking/QuickBookButton";

// Icons for the mobile menu, by link.
const NAV_ICONS = { "/": House, "/cars": CarFront, "/cars?level=luxury": Gem, "/photography": Camera, "/wedding-packages": Gift, "/about": Info, "/contact": Phone };

// Routes that open with a dark, full-bleed hero — the header starts transparent there.
const DARK_HERO = ["/", "/photography", "/wedding-packages", "/about"];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // The quick-book modal; `n` remounts it so each opening starts fresh.
  const [book, setBook] = useState({ open: false, car: "", n: 0 });

  useEffect(() => {
    const onOpen = (e) => setBook((b) => ({ open: true, car: e.detail?.car || "", n: b.n + 1 }));
    window.addEventListener(QUICK_BOOK_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_BOOK_EVENT, onOpen);
  }, []);
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
          overHero ? "bg-navy text-ivory shadow-[0_6px_20px_-12px_rgba(0,0,0,0.6)] lg:bg-transparent lg:bg-gradient-to-b lg:from-ink/70 lg:to-transparent lg:shadow-none" : "border-b border-line/80 bg-ivory/95 text-ink backdrop-blur-md"
        }`}
      >
        <div className="container-x flex h-16 items-center justify-between gap-6 lg:h-[68px]">
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
                className={`hidden min-h-10 items-center gap-2.5 rounded-md border px-4 text-[0.9rem] font-medium transition-colors xl:inline-flex ${
                  overHero ? "border-ivory/70 text-ivory hover:bg-ivory/10" : "border-ink/25 text-ink hover:border-ink"
                }`}
              >
                <Phone className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {site.contact.phone}
              </a>
            )}
            <button
              type="button"
              onClick={() => openQuickBook()}
              aria-haspopup="dialog"
              className="hidden min-h-10 items-center gap-2 rounded-md px-5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] bg-navy text-ivory ring-1 ring-ivory/20 hover:bg-navy-soft shadow-[0_8px_24px_-12px_rgba(9,36,61,0.8)] transition-colors sm:inline-flex"
            >
              Book Now <ArrowRight className="size-4" aria-hidden="true" />
            </button>
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
      <div className={`fixed inset-0 z-[55] lg:hidden ${open ? "visible" : "invisible"}`}>
        {/* Tap outside the drawer to close. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 right-0 flex w-[58vw] min-w-[14rem] max-w-xs flex-col bg-gradient-to-b from-navy to-[#061a2d] text-ivory shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-[var(--ease-luxe)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ivory/10 px-4">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-champagne">Menu</span>
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex size-10 items-center justify-center rounded-full bg-ivory/10 transition-colors hover:bg-ivory/20">
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex flex-1 flex-col overflow-y-auto px-3 pb-5 pt-4">
          <ul className="space-y-1">
            {navigation.map((n, i) => {
              const Icon = NAV_ICONS[n.href] || ChevronRight;
              const active = isActive(n.href);
              return (
                <li key={n.href} style={{ transitionDelay: open ? `${60 + i * 30}ms` : "0ms" }} className={`transition-all duration-500 ${open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-2.5 transition-colors ${active ? "bg-ivory/12 ring-1 ring-ivory/15" : "hover:bg-ivory/8"}`}
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-ivory text-navy" : "bg-ivory/10 text-champagne"}`}>
                      <Icon className="size-4" strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <span className="flex-1 text-[0.9rem] font-medium leading-tight">{n.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openQuickBook();
              }}
              aria-haspopup="dialog"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ivory px-4 py-3 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-navy shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] transition-colors hover:bg-champagne-soft"
            >
              Book Now <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <div className="mt-2 grid gap-2">
              <Link href="/account" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-ivory/20 text-[0.78rem] font-semibold hover:bg-ivory/8">
                <UserRound className="size-4" aria-hidden="true" /> My Account
              </Link>
              {site.contact.phone ? (
                <a href={`tel:${site.contact.phone.replace(/s/g, "")}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-ivory/20 text-[0.78rem] font-semibold hover:bg-ivory/8">
                  <Phone className="size-4" aria-hidden="true" /> Call us
                </a>
              ) : (
                wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-ivory/20 text-[0.78rem] font-semibold hover:bg-ivory/8">
                    <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
                  </a>
                )
              )}
            </div>
            <p className="mt-4 text-center text-[0.55rem] uppercase tracking-[0.22em] text-ivory/45">Mewat · Wedding Car Rental</p>
          </div>
        </nav>
      </div>
      </div>
      <QuickBookModal key={book.n} open={book.open} initialCar={book.car} onClose={() => setBook((b) => ({ ...b, open: false }))} />
    </>
  );
}
