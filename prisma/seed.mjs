// Seeds DEMO catalogue data. Every price below is a sample for demonstration
// only — not real business pricing. All seeded records carry isDemo = true and
// can be edited or removed from the admin panel. Images are Unsplash-licensed
// representative photographs (see public/images/CREDITS.md).
//
// Safe to re-run: records are upserted by slug.

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();
const U = (id) => `https://images.unsplash.com/photo-${id}`;

const categories = [
  { slug: "suv-muv", name: "SUVs & MUVs", description: "Commanding, spacious SUVs for the couple, family and the baraat convoy.", sortOrder: 1 },
  { slug: "luxury-suv", name: "Luxury SUVs", description: "Flagship SUVs for an unforgettable arrival.", sortOrder: 2 },
];

const rule = (o) => ({
  pricingMode: "PACKAGE",
  baseFare: 0, includedKm: 80, includedHours: 8, extraKmRate: 0, extraHourRate: 0,
  minimumFare: 0, minimumKm: 0, minimumHours: 0, driverAllowancePerDay: 500,
  waitingChargePerHour: 0, freeWaitingMinutes: 0, nightCharge: 500, nightStartHour: 22, nightEndHour: 6,
  outstationPerDayCharge: 0, outstationMinKmPerDay: 250,
  tollPolicy: "Toll charges are billed at actuals.",
  parkingPolicy: "Venue and city parking are billed at actuals.",
  ...o,
});

// Wikimedia Commons photographs — attribution shown on each car page and in public/images/CREDITS.md.
const C = (author, license, file) => `Photo: ${author} · ${license} · Wikimedia Commons — https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

// Every car in the fleet is black.
const cars = [
  {
    slug: "land-rover-defender-black", make: "Land Rover", model: "Defender", variant: "110", colour: "Santorini Black", category: "luxury-suv",
    luxuryLevel: "ultra", seats: 4, luggageBags: 3, featured: true, popularity: 95,
    description: "A blacked-out Land Rover Defender 110 with a uniformed chauffeur — bold, modern and unforgettable for the couple's arrival or the groom's entry.",
    highlights: ["Santorini Black finish", "Commanding road presence", "Premium cabin for the couple"],
    images: [
      { url: "/images/cars/land-rover-defender-black.jpg", alt: "Black Land Rover Defender 110 parked on a city street, front view", credit: C("Damian B Oh", "CC BY-SA 4.0", "Land Rover Defender 110 P300 SE L663 Santorini Black (2).jpg") },
      { url: "/images/cars/land-rover-defender-black-front.jpg", alt: "Black Land Rover Defender 110 at a junction, front three-quarter view", credit: C("Damian B Oh", "CC BY-SA 4.0", "Land Rover Defender 110 L663 Santorini Black (3).jpg") },
      { url: "/images/cars/land-rover-defender-black-street.jpg", alt: "Black Land Rover Defender 110 outside a building", credit: C("Damian B Oh", "CC BY-SA 4.0", "Land Rover Defender 110 P300 SE L663 Santorini Black (4).jpg") },
    ],
    pricing: rule({ baseFare: 30000, extraKmRate: 160, extraHourRate: 2500, minimumFare: 30000, driverAllowancePerDay: 800, nightCharge: 2000, outstationPerDayCharge: 8000 }),
  },
  {
    slug: "toyota-fortuner-black", make: "Toyota", model: "Fortuner", colour: "Attitude Black", category: "suv-muv",
    luxuryLevel: "luxury", seats: 6, luggageBags: 4, featured: true, popularity: 90,
    description: "A black Toyota Fortuner — tall, confident and spacious. The favourite for leading the baraat and for destination weddings.",
    highlights: ["Seats six guests", "Strong road presence", "Great for convoy lead"],
    images: [
      { url: "/images/cars/toyota-fortuner-black.jpg", alt: "Black Toyota Fortuner parked on a street, front three-quarter view", credit: C("Retired electrician", "CC0", "Moscow, Teterinsky Lane, Toyota Fortuner black, Sept 2025 02.jpg") },
      { url: "/images/cars/toyota-fortuner-black-side.jpg", alt: "Black Toyota Fortuner, side view", credit: C("Retired electrician", "CC0", "Moscow, Teterinsky Lane, Toyota Fortuner black, Sept 2025 04.jpg") },
      { url: "/images/cars/toyota-fortuner-black-rear.jpg", alt: "Black Toyota Fortuner, rear three-quarter view", credit: C("Retired electrician", "CC0", "Moscow, Teterinsky Lane, Toyota Fortuner black, Sept 2025 01.jpg") },
    ],
    pricing: rule({ baseFare: 8000, extraKmRate: 30, extraHourRate: 500, driverAllowancePerDay: 500, nightCharge: 600, outstationPerDayCharge: 2500 }),
  },
  {
    slug: "mahindra-scorpio-n-black", make: "Mahindra", model: "Scorpio-N", variant: "Z8L", colour: "Black", category: "suv-muv",
    luxuryLevel: "premium", seats: 6, luggageBags: 3, featured: true, popularity: 85,
    description: "The new Mahindra Scorpio-N in black — modern, muscular and comfortable for family members and the bridal party.",
    highlights: ["Seats six guests", "Modern premium cabin", "Ideal for family transfers"],
    images: [
      { url: "/images/cars/mahindra-scorpio-n-black.jpg", alt: "Dark Mahindra Scorpio-N Z8L, side view", credit: C("LuvsMG481", "CC BY-SA 4.0", "2024 Mahindra Scorpio Z8L front.jpg") },
      { url: "/images/cars/mahindra-scorpio-n-black-rear.jpg", alt: "Dark Mahindra Scorpio-N Z8L, rear three-quarter view", credit: C("LuvsMG481", "CC BY-SA 4.0", "2024 Mahindra Scorpio Z8L rear.jpg") },
    ],
    pricing: rule({ baseFare: 6000, extraKmRate: 25, extraHourRate: 400, driverAllowancePerDay: 400, nightCharge: 500, outstationPerDayCharge: 2000 }),
  },
  {
    slug: "mahindra-scorpio-black", make: "Mahindra", model: "Scorpio", variant: "Classic", colour: "Black", category: "suv-muv",
    luxuryLevel: "premium", seats: 6, luggageBags: 3, featured: true, popularity: 80,
    description: "The iconic black Mahindra Scorpio — a dependable, spacious favourite for the baraat convoy and family transfers.",
    highlights: ["Seats six guests", "Classic Scorpio presence", "Value for convoys"],
    images: [
      { url: "/images/cars/mahindra-scorpio-classic-black.jpg", alt: "Black Mahindra Scorpio parked on a street", credit: C("RL GNZLZ from Chile", "CC BY-SA 2.0", "Mahindra Scorpio GLX 2015 (53537807901).jpg") },
    ],
    pricing: rule({ baseFare: 5000, extraKmRate: 22, extraHourRate: 350, driverAllowancePerDay: 400, nightCharge: 400, outstationPerDayCharge: 1800 }),
  },
  {
    slug: "mahindra-thar-black", make: "Mahindra", model: "Thar", colour: "Napoli Black", category: "suv-muv",
    luxuryLevel: "premium", seats: 3, luggageBags: 1, featured: true, popularity: 88,
    description: "A black Mahindra Thar for a rugged, stylish groom's entry and unforgettable pre-wedding photographs.",
    highlights: ["Head-turning groom's entry", "Perfect for pre-wedding shoots", "Seats three guests"],
    images: [
      { url: "/images/cars/mahindra-thar-black.jpg", alt: "Black Mahindra Thar on a wet beachfront road", credit: C("DjDavid1998", "CC BY-SA 4.0", "Mahindra Thar Photoshoot at Perupalem Beach (West Godavari District, AP, India) Djdavid.jpg") },
    ],
    pricing: rule({ baseFare: 6500, extraKmRate: 28, extraHourRate: 450, driverAllowancePerDay: 400, nightCharge: 500, outstationPerDayCharge: 2000 }),
  },
  {
    slug: "hyundai-creta-black", make: "Hyundai", model: "Creta", colour: "Abyss Black", category: "suv-muv",
    luxuryLevel: "budget", seats: 4, luggageBags: 2, featured: true, popularity: 75,
    description: "A smart black Hyundai Creta — comfortable and economical for guest pick-ups and family transfers.",
    highlights: ["Most economical option", "Comfortable for four guests", "Easy to park at busy venues"],
    images: [
      { url: "/images/cars/hyundai-creta-black.jpg", alt: "Black Hyundai Creta in a showroom, front three-quarter view", credit: C("Chanokchon", "CC BY-SA 4.0", "2023 Hyundai Creta Black Edition.jpg") },
    ],
    pricing: rule({ pricingMode: "PER_KM", includedKm: 0, includedHours: 0, extraKmRate: 18, minimumKm: 80, minimumFare: 2800, waitingChargePerHour: 200, freeWaitingMinutes: 60, driverAllowancePerDay: 400, nightCharge: 300, outstationPerDayCharge: 1200 }),
  },
];

// Garage cities the cars start from. Villages are added in Admin → Catalogue → Locations.
const garages = [
  { slug: "nuh", city: "Nuh", sortOrder: 1 },
  { slug: "firozpur-jhirka", city: "Firozpur Jhirka", sortOrder: 2 },
  { slug: "punhana", city: "Punhana", sortOrder: 3 },
  { slug: "tauru", city: "Tauru", sortOrder: 4 },
];

const decorations = [
  { slug: "ribbon-and-nameplate", name: "Ribbon & Name Plate", description: "Satin ribbons on bonnet and handles with a personalised name plate.", price: 1500, sortOrder: 1 },
  { slug: "classic-floral", name: "Classic Floral", description: "Fresh roses and baby's breath on the bonnet with ribbon detailing.", price: 3500, sortOrder: 2 },
  { slug: "royal-floral", name: "Royal Floral", description: "Full bonnet arrangement, door garlands and rear-windshield floral heart.", price: 7500, sortOrder: 3 },
  { slug: "signature-couture", name: "Signature Couture", description: "Bespoke design matched to your wedding palette with premium imported flowers.", price: 15000, sortOrder: 4 },
];

const photoPackages = [
  { slug: "essential-photography", name: "Essential Photography", tier: "Essential", serviceType: "PHOTOGRAPHY", description: "Graceful coverage of one ceremony by a lead photographer.", price: 35000, photographers: 1, hours: 6, eventDays: 1, editedPhotos: 300, deliveryDays: 21, extraHourRate: 3000, extraDayRate: 25000, inclusions: ["Lead photographer", "300 professionally edited photographs", "Online gallery for 12 months"], travelPolicy: "Local travel included. Outstation travel and stay billed at actuals.", sortOrder: 1 },
  { slug: "classic-photography", name: "Classic Photography", tier: "Classic", serviceType: "PHOTOGRAPHY", description: "Traditional and candid photography from two photographers.", price: 65000, photographers: 2, hours: 8, eventDays: 1, editedPhotos: 500, album: "30-sheet premium album", deliveryDays: 30, extraHourRate: 4500, extraDayRate: 45000, inclusions: ["Traditional + candid photographers", "500 edited photographs", "30-sheet premium album", "Online gallery"], travelPolicy: "Local travel included. Outstation travel and stay billed at actuals.", sortOrder: 2 },
  { slug: "premium-photography", name: "Premium Photography", tier: "Premium", serviceType: "PHOTOGRAPHY", description: "Two-day coverage with a senior candid team and heirloom albums.", price: 120000, photographers: 3, hours: 10, eventDays: 2, editedPhotos: 900, album: "Two 40-sheet layflat albums", deliveryDays: 45, extraHourRate: 6000, extraDayRate: 55000, inclusions: ["Senior candid + traditional team", "Two days of coverage", "900+ edited photographs", "Two layflat albums"], travelPolicy: "Outstation travel and stay billed at actuals.", sortOrder: 3 },
  { slug: "classic-wedding-film", name: "Classic Wedding Film", tier: "Classic", serviceType: "VIDEOGRAPHY", description: "A heartfelt highlight film and full-length documentary edit.", price: 60000, videographers: 1, hours: 8, eventDays: 1, videoDuration: "4–5 min highlight + 60 min documentary", highlightFilm: true, reels: 2, deliveryDays: 45, extraHourRate: 4000, extraDayRate: 40000, inclusions: ["Lead cinematographer", "Highlight film", "Documentary edit", "2 social reels"], travelPolicy: "Local travel included.", sortOrder: 4 },
  { slug: "cinematic-signature", name: "Cinematic Signature", tier: "Cinematic Signature", serviceType: "VIDEOGRAPHY", description: "Our most cinematic experience — multi-camera storytelling, aerial footage where permitted, and a feature-style film.", price: null, quoteOnly: true, videographers: 3, photographers: 0, hours: 12, eventDays: 2, videoDuration: "6–8 min feature + teaser + full edit", highlightFilm: true, reels: 4, deliveryDays: 60, inclusions: ["Three cinematographers", "Drone footage (subject to permissions)", "Feature film + teaser", "4 social reels", "Licensed music"], travelPolicy: "Quoted per itinerary.", sortOrder: 5 },
  { slug: "premium-photo-film", name: "Premium Photo + Film", tier: "Premium", serviceType: "PHOTO_VIDEO", description: "Complete photography and film coverage from one coordinated team.", price: 175000, photographers: 2, videographers: 2, hours: 10, eventDays: 2, editedPhotos: 800, videoDuration: "5 min highlight + documentary", highlightFilm: true, reels: 3, album: "40-sheet layflat album", deliveryDays: 45, extraHourRate: 8000, extraDayRate: 80000, inclusions: ["2 photographers + 2 cinematographers", "Highlight film + documentary", "800 edited photographs", "Layflat album", "3 reels"], travelPolicy: "Outstation travel and stay billed at actuals.", sortOrder: 6 },
  { slug: "pre-wedding-shoot", name: "Pre-wedding Shoot", tier: "Essential", serviceType: "PRE_WEDDING", description: "A relaxed half-day portrait session at one location of your choice.", price: 25000, photographers: 1, hours: 4, eventDays: 1, editedPhotos: 60, deliveryDays: 14, extraHourRate: 3000, inclusions: ["1 photographer", "1 location", "60 edited photographs", "Styling guidance"], travelPolicy: "Location fees and permits billed at actuals.", sortOrder: 7 },
  { slug: "pre-wedding-film", name: "Pre-wedding Film", tier: "Premium", serviceType: "PRE_WEDDING", description: "A short romantic film plus portraits across two locations.", price: 55000, photographers: 1, videographers: 1, hours: 6, eventDays: 1, editedPhotos: 80, videoDuration: "2–3 min film", highlightFilm: true, reels: 1, deliveryDays: 21, extraHourRate: 5000, inclusions: ["Photographer + cinematographer", "2 locations", "2–3 minute film", "80 edited photographs", "1 reel"], travelPolicy: "Location fees and permits billed at actuals.", sortOrder: 8 },
];

const addOns = [
  { slug: "drone-coverage", name: "Drone coverage", category: "PHOTO", description: "Aerial photo and video. Subject to venue and airspace permissions.", price: 12000, unit: "PER_DAY", sortOrder: 1 },
  { slug: "extra-photographer", name: "Additional photographer", category: "PHOTO", description: "One more photographer for large gatherings.", price: 8000, unit: "PER_DAY", sortOrder: 2 },
  { slug: "same-day-edit", name: "Same-day edit reel", category: "PHOTO", description: "A short reel edited and delivered the same evening.", price: 10000, unit: "FLAT", sortOrder: 3 },
  { slug: "extra-album", name: "Additional album", category: "PHOTO", description: "A duplicate album for parents or family.", price: 15000, unit: "PER_UNIT", sortOrder: 4 },
  { slug: "live-stream", name: "Ceremony live stream", category: "PHOTO", description: "Private HD live stream for remote family.", price: 15000, unit: "FLAT", sortOrder: 5 },
  { slug: "family-sedan", name: "Additional family SUV", category: "CAR", description: "An extra black Creta with chauffeur for family (8 hrs / 80 km).", price: 4000, unit: "PER_UNIT", sortOrder: 6 },
  { slug: "red-carpet-welcome", name: "Red carpet welcome", category: "CAR", description: "Red carpet and door service at arrival.", price: 2500, unit: "FLAT", sortOrder: 7 },
  { slug: "welcome-hamper", name: "On-board welcome hamper", category: "CAR", description: "Chilled water, refreshments and tissues in the couple's car.", price: 1500, unit: "FLAT", sortOrder: 8 },
];

const weddingPackages = [
  { slug: "the-grand-arrival", name: "The Grand Arrival", tagline: "Black Defender, couture florals and a feature film", description: "Our most indulgent experience: a blacked-out Land Rover Defender dressed in bespoke florals, with a multi-camera cinematic team capturing every moment.", imageUrl: "/images/cars/land-rover-defender-black-front.jpg", inclusions: ["Land Rover Defender with chauffeur (8 hrs / 80 km)", "Signature Couture decoration", "Cinematic Signature film team", "Drone coverage (subject to permissions)"], exclusions: ["Tolls and parking", "Outstation travel and stay", "Venue permission fees"], durationText: "Wedding day, up to 8 hours of car service", suggestedCarSlug: "land-rover-defender-black", photoPackageSlug: "cinematic-signature", decorationSlug: "signature-couture", addOnSlugs: ["drone-coverage"], quoteOnly: true, sortOrder: 1 },
  { slug: "classic-celebration", name: "Classic Celebration", tagline: "Black Fortuner with florals and two photographers", description: "A confident black Fortuner for the couple, paired with traditional and candid photography.", imageUrl: "/images/cars/toyota-fortuner-black.jpg", inclusions: ["Toyota Fortuner with chauffeur (8 hrs / 80 km)", "Classic Floral decoration", "Classic Photography (2 photographers, album)"], exclusions: ["Tolls and parking", "Extra hours and kilometres", "Outstation travel"], durationText: "One wedding day", suggestedCarSlug: "toyota-fortuner-black", photoPackageSlug: "classic-photography", decorationSlug: "classic-floral", addOnSlugs: [], sortOrder: 2 },
  { slug: "thar-pre-wedding", name: "Thar Pre-wedding Story", tagline: "A black Thar and a two-location film", description: "A rugged black Thar for adventurous portraits, paired with a two-location pre-wedding film.", imageUrl: "/images/cars/mahindra-thar-black.jpg", inclusions: ["Mahindra Thar with chauffeur (8 hrs / 80 km)", "Ribbon & Name Plate decoration", "Pre-wedding Film"], exclusions: ["Location permits", "Tolls and parking"], durationText: "One shoot day", suggestedCarSlug: "mahindra-thar-black", photoPackageSlug: "pre-wedding-film", decorationSlug: "ribbon-and-nameplate", addOnSlugs: [], sortOrder: 3 },
  { slug: "intimate-essentials", name: "Intimate Essentials", tagline: "Graceful, considered and within budget", description: "A black Scorpio-N with fresh florals and essential photography for intimate ceremonies.", imageUrl: "/images/cars/mahindra-scorpio-n-black.jpg", inclusions: ["Mahindra Scorpio-N with chauffeur (8 hrs / 80 km)", "Classic Floral decoration", "Essential Photography"], exclusions: ["Tolls and parking", "Albums"], durationText: "One ceremony", suggestedCarSlug: "mahindra-scorpio-n-black", photoPackageSlug: "essential-photography", decorationSlug: "classic-floral", addOnSlugs: [], sortOrder: 4 },
];

const portfolio = [
  ["Mandap at dusk", "wedding", "/images/wedding/mandap.jpg", "Grand Indian wedding mandap lit with chandeliers and flowers"],
  ["The pheras", "wedding", "/images/wedding/ritual-hands.jpg", "Bride and groom's hands joined during a wedding ritual"],
  ["Mehendi morning", "candid", "/images/wedding/mehendi.jpg", "Several hands decorated with intricate mehendi"],
  ["Bridal portrait", "candid", "/images/wedding/bridal-portrait.jpg", "Bride in a pink and orange silk saree with gold jewellery"],
  ["First look", "candid", "/images/wedding/celebration.jpg", "Couple kissing as guests shower flower petals"],
  ["The exit", "wedding", "/images/wedding/confetti-exit.jpg", "Couple walking through confetti held by guests"],
  ["Monochrome vows", "wedding", "/images/wedding/couple-monochrome.jpg", "Black and white photograph of a couple embracing, veil in the wind"],
  ["By the window", "wedding", "/images/wedding/couple-window.jpg", "Couple silhouetted against tall curtained windows"],
  ["Valley walk", "pre-wedding", "/images/wedding/couple-valley.jpg", "Couple walking hand in hand across a valley at golden hour"],
  ["Hilltop", "pre-wedding", "/images/wedding/couple-hilltop.jpg", "Couple embracing on a hilltop overlooking farmland"],
  ["Garden light", "pre-wedding", "/images/wedding/pre-wedding-garden.jpg", "Couple in soft garden light holding dried flowers"],
  ["Black sand shore", "films", "/images/wedding/couple-black-sand.jpg", "Couple on a black sand beach with sea stacks behind"],
  ["Shoreline", "films", "/images/wedding/couple-shore.jpg", "Bride and groom by the sea with a long veil"],
  ["Lakeside", "pre-wedding", "/images/wedding/couple-lake.jpg", "Couple posing by a lake surrounded by autumn trees"],
  ["Aerial perspective", "drone", "/images/studio/drone.jpg", "White camera drone hovering above a forest"],
  ["Behind the lens", "films", "/images/studio/camera.jpg", "Photographer holding a camera against the sun"],
  ["Printed memories", "albums", "/images/studio/prints.jpg", "Printed instant photographs scattered on a table"],
  ["The rings", "albums", "/images/wedding/gold-rings.jpg", "Two gold wedding rings resting on white fabric"],
];

async function main() {
  console.log("Seeding demo data…");
  const catIds = {};
  for (const c of categories) {
    const row = await prisma.carCategory.upsert({ where: { slug: c.slug }, update: c, create: c });
    catIds[c.slug] = row.id;
  }

  // Keep the fleet exactly as defined above: remove demo cars and packages that are no longer listed.
  const removed = await prisma.car.deleteMany({ where: { isDemo: true, slug: { notIn: cars.map((c) => c.slug) }, bookings: { none: {} } } });
  if (removed.count) console.log(`Removed ${removed.count} old demo car(s).`);
  await prisma.weddingPackage.deleteMany({ where: { isDemo: true, slug: { notIn: weddingPackages.map((w) => w.slug) } } });

  for (const c of cars) {
    const { images, pricing, category, featured, highlights, airConditioned = true, ...rest } = c;
    const data = { ...rest, highlights, airConditioned, isFeatured: Boolean(featured), isDemo: true, categoryId: catIds[category] };
    const car = await prisma.car.upsert({ where: { slug: c.slug }, update: data, create: data });
    await prisma.carImage.deleteMany({ where: { carId: car.id } });
    for (const [i, img] of images.entries()) await prisma.carImage.create({ data: { ...img, carId: car.id, sortOrder: i } });
    await prisma.vehiclePricingRule.upsert({ where: { carId: car.id }, update: pricing, create: { ...pricing, carId: car.id } });
  }

  await prisma.carCategory.deleteMany({ where: { slug: { notIn: categories.map((c) => c.slug) }, cars: { none: {} } } });

  for (const g of garages) {
    await prisma.serviceLocation.upsert({
      where: { slug: g.slug },
      update: {},
      create: { ...g, kind: "CITY", isBase: true, region: "Nuh, Haryana", isActive: true },
    });
  }

  for (const d of decorations) await prisma.decorationPackage.upsert({ where: { slug: d.slug }, update: { ...d, isDemo: true }, create: { ...d, isDemo: true } });
  for (const p of photoPackages) await prisma.photoPackage.upsert({ where: { slug: p.slug }, update: { ...p, isDemo: true }, create: { ...p, isDemo: true } });
  for (const a of addOns) await prisma.addOnService.upsert({ where: { slug: a.slug }, update: { ...a, isDemo: true }, create: { ...a, isDemo: true } });
  for (const w of weddingPackages) await prisma.weddingPackage.upsert({ where: { slug: w.slug }, update: { ...w, isDemo: true }, create: { ...w, isDemo: true } });

  if ((await prisma.portfolioItem.count()) === 0) {
    for (const [i, [title, category, imageUrl, alt]] of portfolio.entries()) {
      await prisma.portfolioItem.create({ data: { title, category, imageUrl, alt, isDemo: true, sortOrder: i } });
    }
  }

  if ((await prisma.vendor.count()) === 0) {
    await prisma.vendor.create({ data: { name: "In-house fleet (sample vendor)", type: "CAR_OPERATOR", crewCapacity: 10, notes: "Demo vendor — replace with your operators." } });
    await prisma.vendor.create({ data: { name: "In-house studio (sample vendor)", type: "PHOTOGRAPHER", crewCapacity: 3, notes: "Demo vendor — replace with your crew." } });
  }

  // Inactive demo coupon to exercise the coupon flow. Activate in admin to test.
  await prisma.coupon.upsert({
    where: { code: "DEMO10" },
    update: {},
    create: { code: "DEMO10", description: "Demo coupon (inactive) — delete before launch", type: "PERCENT", value: 10, maxDiscount: 5000, isActive: false },
  });

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 10) {
    await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", isActive: true },
      create: { email, name: "Administrator", role: "ADMIN", passwordHash: hashPassword(password) },
    });
    console.log(`Admin account ready: ${email}`);
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set (min 10 chars) — skipping admin creation. Run `npm run admin:create`.");
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
