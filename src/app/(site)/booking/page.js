import PageHeader from "@/components/ui/PageHeader";
import BookingWizard from "@/components/booking/BookingWizard";
import { loadBookingCatalog } from "@/lib/quote-service";
import { getCurrentUser } from "@/lib/auth";
import { razorpayConfigured } from "@/lib/razorpay";
import { SERVICE_TYPES, isDate } from "@/lib/validation";

export const metadata = {
  title: "Book & Price Calculator",
  description: "Get an itemised estimate for your wedding car, photography or complete package — based on the real driving route — and send a booking request.",
  alternates: { canonical: "/booking" },
};

const str = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");

/** Reads pre-selections passed from car pages, the homepage search or the package builder. */
function parseInitial(sp, catalog) {
  const initial = {
    service: SERVICE_TYPES.includes(sp.service) ? sp.service : null,
    car: catalog.cars.some((c) => c.slug === sp.car) ? sp.car : null,
    deco: catalog.decorations.some((d) => d.slug === sp.deco) ? sp.deco : null,
    date: isDate(sp.date) ? sp.date : "",
    pickup: str(sp.pickup),
    venue: str(sp.venue),
    pickupPlace: str(sp.pickupPlace, 40) || null,
    venuePlace: str(sp.venuePlace, 40) || null,
    package: catalog.weddingPackages.some((w) => w.slug === sp.package) ? sp.package : null,
    // photo=slug or slug:extraHours:extraDays, comma-separated
    photo: str(sp.photo, 400)
      .split(",")
      .map((part) => part.split(":"))
      .filter(([slug]) => catalog.photoPackages.some((p) => p.slug === slug))
      .map(([slug, h, d]) => ({ slug, extraHours: Math.min(12, Math.max(0, Number(h) || 0)), extraDays: Math.min(6, Math.max(0, Number(d) || 0)) })),
    addOns: str(sp.addons, 400)
      .split(",")
      .map((pair) => pair.split(":"))
      .filter(([slug]) => catalog.addOns.some((a) => a.slug === slug))
      .map(([slug, q]) => ({ slug, quantity: Math.min(10, Math.max(1, Number(q) || 1)) })),
  };
  if (initial.car && !initial.service) initial.service = "CAR";

  // Starting from a curated package: pre-fill its components unless the URL already chose them.
  const wp = catalog.weddingPackages.find((w) => w.slug === initial.package);
  if (wp) {
    initial.service = "COMBINED";
    if (!initial.car && catalog.cars.some((c) => c.slug === wp.suggestedCarSlug)) initial.car = wp.suggestedCarSlug;
    if (!initial.deco && wp.decorationSlug) initial.deco = wp.decorationSlug;
    if (!initial.photo.length && wp.photoPackageSlug) initial.photo = [{ slug: wp.photoPackageSlug, extraHours: 0, extraDays: 0 }];
    if (!initial.addOns.length && Array.isArray(wp.addOnSlugs)) initial.addOns = wp.addOnSlugs.map((slug) => ({ slug, quantity: 1 }));
  }
  return initial;
}

export default async function BookingPage({ searchParams }) {
  const sp = await searchParams;
  const [catalog, user] = await Promise.all([loadBookingCatalog(), getCurrentUser()]);
  const initial = parseInitial(sp, catalog);

  return (
    <>
      <PageHeader
        eyebrow="Booking & price calculator"
        title="Plan your booking"
        intro="Tell us about your celebration and see an itemised estimate as you go. Nothing is charged when you submit a request."
        crumbs={[{ label: "Booking" }]}
      />
      <section className="container-x py-12 lg:py-16">
        <BookingWizard
          catalog={JSON.parse(JSON.stringify(catalog))}
          initial={initial}
          user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
          paymentsEnabled={razorpayConfigured()}
        />
      </section>
    </>
  );
}
