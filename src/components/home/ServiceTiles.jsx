import Link from "next/link";
import { CarFront, Camera, Gift, Flower2, SearchCheck } from "lucide-react";

// Top row: the three main services.
const MAIN = [
  { label: "Wedding Cars", href: "/cars", icon: CarFront },
  { label: "Photography & Films", href: "/photography", icon: Camera, badge: "Sabse Kam Price" },
  { label: "Wedding Packages", href: "/wedding-packages", icon: Gift },
];

// After the cars: two quick links to fill the second row.
const EXTRA = [
  { label: "Car Decoration", href: "/cars?decorated=1", icon: Flower2 },
  { label: "Booking Status", href: "/bookings/lookup", icon: SearchCheck },
];

function IconBox({ icon: Icon, large }) {
  return (
    <span
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-champagne-soft to-white text-navy shadow-[inset_0_0_0_1px_rgba(9,36,61,0.06)] transition-transform duration-300 group-hover:scale-110 ${
        large ? "size-10 sm:size-11" : "size-8 sm:size-9"
      }`}
      aria-hidden="true"
    >
      <Icon className={large ? "size-5 sm:size-6" : "size-4 sm:size-[1.15rem]"} strokeWidth={1.6} />
    </span>
  );
}

/** Icon-tile menu shown on the hero photo: main services, then each car and quick links. */
export default function ServiceTiles({ cars = [] }) {
  const tiles = [...cars.slice(0, 6).map((c) => ({ label: c.model, sub: c.make, href: `/cars/${c.slug}`, icon: CarFront })), ...EXTRA];

  return (
    <nav aria-label="Services and cars">
      {/* Main services */}
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {MAIN.map((m) => (
          <li key={m.label}>
            <Link
              href={m.href}
              className="group relative flex h-full flex-col items-center gap-1.5 rounded-xl bg-gradient-to-b from-white to-champagne-soft px-2 pb-2.5 pt-3.5 text-center shadow-[0_14px_34px_-16px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-16px_rgba(0,0,0,0.7)] sm:pb-3 sm:pt-4"
            >
              {m.badge && (
                <span className="absolute -top-2.5 left-2 rounded-md bg-navy px-2 py-0.5 text-[0.55rem] font-semibold text-ivory shadow ring-1 ring-ivory/30 sm:left-3 sm:text-[0.62rem]">
                  {m.badge}
                </span>
              )}
              <IconBox icon={m.icon} large />
              <span className="text-[0.72rem] font-semibold leading-tight text-ink sm:text-[0.85rem]">{m.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Cars & quick links, in a frosted-glass panel over the photo */}
      <div className="mt-2.5 rounded-xl border border-white/50 bg-white/15 p-1.5 shadow-[0_14px_40px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md sm:mt-3 sm:p-2">
        <ul className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {tiles.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="group flex h-full flex-col items-center justify-center gap-1 rounded-lg bg-white px-1 py-2 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.6)] sm:gap-1.5 sm:py-2.5"
              >
                <IconBox icon={t.icon} />
                <span className="text-[0.64rem] font-medium leading-tight text-ink sm:text-[0.78rem]">
                  {t.sub && <span className="hidden text-stone lg:inline">{t.sub} </span>}
                  {t.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
