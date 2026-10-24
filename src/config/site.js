// ─────────────────────────────────────────────────────────────
// Central brand & business configuration.
// Change the brand name, contact details and policies here — every page
// reads from this file. Values wrapped in PLACEHOLDER are intentionally
// not invented; the UI shows them as "to be added" until you replace them.
// ─────────────────────────────────────────────────────────────

export const PLACEHOLDER = null;

export const site = {
  name: "Royal Wedding",
  shortName: "Royal Wedding",
  tagline: "Wedding cars, films & photography",
  logoSubtitle: "Wedding Car Rental",

  // Homepage hero. Replace the image with a photo of your own decorated car
  // (landscape, at least 1800px wide; the car should sit in the right half).
  hero: {
    image: "/images/hero/fortuner-decorated.jpg",
    imageAlt: "A white Toyota Fortuner decorated with pink and white flowers and a Just Married plate",
    // A YouTube/Vimeo link to your wedding-car film. The "Watch Video" button
    // only appears when this is set.
    videoUrl: PLACEHOLDER,
  },
  description:
    "Black wedding SUVs with chauffeurs — Thar, Scorpio, Scorpio-N, Fortuner, Creta and Defender — plus cinematic films and timeless photography, booked in one place.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "en_IN",
  currency: "INR",

  contact: {
    // Replace with your real details. Leave as PLACEHOLDER to hide.
    phone: PLACEHOLDER, // e.g. "+91 98765 43210"
    whatsapp: PLACEHOLDER, // digits only with country code, e.g. "919876543210"
    email: PLACEHOLDER, // e.g. "hello@yourdomain.com"
    address: PLACEHOLDER, // full studio / garage address
    hours: PLACEHOLDER, // e.g. "Mon–Sun, 9am – 9pm"
  },

  social: {
    instagram: PLACEHOLDER,
    youtube: PLACEHOLDER,
    facebook: PLACEHOLDER,
  },

  legal: {
    entityName: PLACEHOLDER, // registered business name
    gstin: PLACEHOLDER, // when set, receipts can show it
    jurisdiction: PLACEHOLDER, // e.g. "Courts of Mumbai, Maharashtra"
    policiesLastUpdated: PLACEHOLDER,
  },
};

// Commercial rules used by the server-side pricing engine.
// These are DEMO defaults — confirm them with your accountant before going live.
export const business = {
  taxRatePercent: 18, // GST on services (demo default)
  taxLabel: "GST",
  advancePercent: 25, // booking advance as % of estimated total
  minimumAdvance: 2000,
  // When true, customers may pay the advance immediately for bookings whose
  // price was computed from a live route (no manual review needed).
  allowInstantAdvance: true,
  // Distance (km, one way) beyond which a trip is treated as outstation.
  outstationThresholdKm: 120,
  // Bill the car's travel from the nearest garage (locations marked "Garage"
  // in Admin → Catalogue → Locations) to the pickup, and back after the event.
  garageToGarage: true,
  // District & state added when looking up a place by name on Google Maps.
  placesRegion: "Nuh, Haryana",
  reminderDaysBefore: 3,
};

// `short` is used in the desktop bar; the mobile menu shows the full label.
export const navigation = [
  { label: "Home", short: "Home", href: "/" },
  { label: "Wedding Cars", short: "Wedding Cars", href: "/cars" },
  { label: "Luxury Cars", short: "Luxury Cars", href: "/cars?level=luxury" },
  { label: "Photography & Films", short: "Photography", href: "/photography" },
  { label: "Wedding Packages", short: "Packages", href: "/wedding-packages", desktop: false },
  { label: "About Us", short: "About", href: "/about" },
  { label: "Contact", short: "Contact", href: "/contact" },
];

export const footerNavigation = {
  services: [
    { label: "Wedding Car Rental", href: "/cars" },
    { label: "Luxury SUVs", href: "/cars?level=luxury" },
    { label: "6+ seater SUVs", href: "/cars?seats=6" },
    { label: "Photography & Films", href: "/photography" },
    { label: "Wedding Packages", href: "/wedding-packages" },
    { label: "Price Calculator", href: "/booking" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Track a Booking", href: "/bookings/lookup" },
    { label: "My Account", href: "/account" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
  ],
};

export const PRICE_DISCLAIMER =
  "Prices shown are estimates until confirmed by the service provider. Final pricing may depend on route, vehicle availability, waiting time, tolls, parking and the agreed service terms.";

export function whatsappLink(message) {
  if (!site.contact.whatsapp) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.contact.whatsapp}${text}`;
}
