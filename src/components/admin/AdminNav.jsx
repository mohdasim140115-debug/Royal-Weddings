"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, CalendarCheck, Inbox, Car, Camera, Tags, Menu, X, ExternalLink } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { LogoutButton } from "@/components/account/AccountActions";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck },
  { href: "/admin/enquiries", label: "Enquiries", Icon: Inbox },
  { href: "/admin/cars", label: "Cars & availability", Icon: Car },
  { href: "/admin/photography", label: "Photography & crew", Icon: Camera },
  { href: "/admin/catalog", label: "Catalogue & pricing", Icon: Tags },
];

export default function AdminNav({ user, counts = {} }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));

  const links = (
    <ul className="space-y-1">
      {NAV.map((n) => (
        <li key={n.href}>
          <Link
            href={n.href}
            onClick={() => setOpen(false)}
            aria-current={active(n) ? "page" : undefined}
            className="flex min-h-11 items-center gap-3 px-3 text-sm text-ivory/70 transition-colors hover:bg-ivory/5 hover:text-ivory aria-[current=page]:bg-ivory/10 aria-[current=page]:text-ivory"
          >
            <n.Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
            <span className="flex-1">{n.label}</span>
            {counts[n.href] > 0 && <span className="rounded-full bg-champagne px-2 py-0.5 text-[0.65rem] font-semibold text-ink">{counts[n.href]}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="flex items-center justify-between bg-ink px-4 py-3 text-ivory lg:hidden">
        <Logo light />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="inline-flex size-11 items-center justify-center">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <aside className={`${open ? "block" : "hidden"} bg-ink text-ivory lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col`}>
        <div className="hidden px-6 py-6 lg:block">
          <Logo light />
        </div>
        <nav aria-label="Admin" className="flex-1 px-3 py-4 lg:py-2">{links}</nav>
        <div className="space-y-2 border-t border-ivory/10 px-6 py-5 text-sm">
          <p className="text-ivory/80">{user.name}</p>
          <p className="text-xs text-ivory/50">{user.role}</p>
          <Link href="/" className="flex min-h-10 items-center gap-2 text-xs text-ivory/60 hover:text-ivory">
            <ExternalLink className="size-3.5" aria-hidden="true" /> View website
          </Link>
          <div className="[&_button]:text-ivory/70 [&_button:hover]:text-ivory">
            <LogoutButton redirectTo="/admin/login" />
          </div>
        </div>
      </aside>
    </>
  );
}
