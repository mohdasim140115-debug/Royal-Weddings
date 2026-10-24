# Royal Wedding — Wedding Cars, Photography & Films

A premium booking platform for wedding car rentals, photography, films and combined wedding
packages. Customers browse the fleet, get an itemised estimate based on the real driving route,
and submit a booking request. Staff confirm, assign cars and crew, update quotes and record
payments in a protected admin area.

Built with **Next.js 16 (App Router, JavaScript/JSX only)**, React 19, Tailwind CSS 4,
Prisma 6 and Lucide icons. No TypeScript.

> **Preview data:** the catalogue ships with clearly-labelled **sample** cars, packages and prices
> (`isDemo = true`), plus Unsplash-licensed representative photos (Wikimedia Commons / Unsplash). Replace them before launch —
> see the [launch checklist](#launch-checklist).

---

## What works today

| Area | Status |
| --- | --- |
| Homepage, fleet catalogue (search, filters, sort, grid/list, pagination), car detail pages | ✅ Working |
| Distance-based price calculator & server-side pricing engine | ✅ Working (manual-distance mode until Maps is configured) |
| Photography & films page, portfolio lightbox, packages | ✅ Working |
| Combined package builder with live estimate | ✅ Working |
| 6-step booking flow, validation, duplicate-submission protection | ✅ Working |
| Guest booking links, booking lookup, customer accounts, reschedule/cancel requests | ✅ Working |
| Admin: dashboard, bookings, conflicts, quotes, payments, cars, pricing, images, availability, catalogue, enquiries, CSV export | ✅ Working |
| SEO: metadata, canonical URLs, Open Graph, sitemap, robots, JSON-LD, breadcrumbs | ✅ Working |
| **Live driving routes** (Google Routes API) | 🔑 Needs `GOOGLE_MAPS_API_KEY` |
| **Online payments** (Razorpay) | 🔑 Needs Razorpay keys + webhook |
| **Email notifications** (Resend) | 🔑 Needs `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM` |
| **WhatsApp notifications** (Meta Cloud API) | 🔑 Needs WhatsApp token + phone number ID |
| WhatsApp click-to-chat buttons | 🔑 Appear once `site.contact.whatsapp` is set |

Integrations that are not configured are shown as **Not configured** in the admin dashboard,
and the site never pretends otherwise (no fake routes, payments or "sent" messages).

---

## Quick start

Requirements: **Node.js 20.9+** (tested on Node 24).

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill in AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:push             # create the database schema
npm run db:seed             # load demo catalogue + create the admin account
npm run dev                 # http://localhost:3000
```

Admin: <http://localhost:3000/admin> — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Generate a strong `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server (`build` runs `prisma generate` first) |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm test` | Pricing-engine unit tests (`node:test`, no extra dependencies) |
| `npm run db:push` | Sync schema to the database (development) |
| `npm run db:migrate` | Create and apply a migration (use for production schema changes) |
| `npm run db:seed` | Upsert demo data and the admin account (safe to re-run) |
| `npm run db:reset` | ⚠️ Drop all data, recreate schema, reseed |
| `npm run admin:create -- <email> <password> [name]` | Create/promote an admin |

---

## Environment variables

See [.env.example](.env.example). Secrets are read **only on the server**; nothing sensitive is
exposed to the browser (there are no `NEXT_PUBLIC_` secrets).

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | `file:./dev.db` (SQLite) locally; a PostgreSQL URL in production |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public URL for canonical links, sitemap, Open Graph, email links |
| `AUTH_SECRET` | ✅ | ≥ 32 random characters; signs sessions and guest booking links |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed | First admin account (password ≥ 10 chars) |
| `GOOGLE_MAPS_API_KEY` | optional | Enables live driving routes |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | optional | Enables online advance/balance payments |
| `RAZORPAY_WEBHOOK_SECRET` | with Razorpay | Verifies webhook signatures |
| `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `EMAIL_ADMIN_TO` | optional | Resend email notifications |
| `WHATSAPP_PROVIDER_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | optional | WhatsApp Cloud API notifications |
| `CRON_SECRET` | optional | Protects the reminder endpoint |
| `UPLOAD_DIR` | optional | Where admin image uploads are stored (default `./uploads`) |

---

## Branding & business settings

Everything brand-related lives in **[src/config/site.js](src/config/site.js)**:

- `site.name` — change "Royal Wedding" in one place.
- `site.contact` — phone, WhatsApp, email, address, hours. Left as `null` on purpose: empty values
  are hidden rather than invented.
- `site.legal` — registered entity, GSTIN, jurisdiction, policy date.
- `business` — tax rate (demo 18% GST), advance %, minimum advance, outstation threshold,
  reminder lead time. **Confirm these with your accountant.**

Marketing copy and FAQs: [src/config/content.js](src/config/content.js).
Design tokens (colours, fonts): [src/app/globals.css](src/app/globals.css).

---

## Pricing engine

Pure, unit-tested functions in [src/lib/pricing.js](src/lib/pricing.js); orchestration (loading
rates, route lookup, coupons) in [src/lib/quote-service.js](src/lib/quote-service.js).
**The server always recalculates** — prices sent by the browser are ignored, and every booking
stores its original inputs and full breakdown for later review.

Per vehicle (all values editable per car in Admin → Cars):

```
  base fare × days                          ← covers included km and hours (per day)
+ max(0, chargeable km − included km × days) × extra-km rate
+ max(0, chargeable hours − included hours × days) × extra-hour rate   (waiting included)
    — or, for pure per-km cars (hour rate = 0) —
+ (waiting − free minutes) × waiting rate
+ minimum-fare top-up (only if the above is below the minimum fare)
+ chauffeur allowance × days
+ night charge (if the service runs into the night window)
+ outstation charge × days
+ decoration, photography/film packages, add-ons
− package saving (only if configured > 0) − valid coupon
+ tax on the discounted taxable amount
= estimated total   (tolls estimated by the route provider are not taxed;
                     otherwise tolls & parking are listed "at actuals")
```

- `chargeable km = max(actual route km, minimum km, outstation min km/day × days)`
- `chargeable hours = max(driving time + waiting, minimum hours)`, rounded up
- Included kilometres are paid for by the base fare and subtracted **before** extra distance is
  charged, so they are never billed twice.
- One-way trips bill pickup → stops → venue; round trips bill the full loop back to pickup.
- Trips over `business.outstationThresholdKm` one-way are treated as outstation automatically.

The seeded fleet is six black SUVs (Thar, Scorpio, Scorpio-N, Fortuner, Creta, Defender) using **package** pricing, plus **per-km** pricing on the Creta;
hourly pricing is also supported. Run `npm test` to see the rules exercised.

---

## Google Maps (live routes)

1. In Google Cloud, enable **Routes API** (it covers both `computeRoutes` and `computeRouteMatrix`) and create an API key.
2. Restrict the key: *API restrictions → Routes API*; *Application restrictions → IP addresses*
   (your server's IPs). The key is used server-side only.
3. Set `GOOGLE_MAPS_API_KEY` and restart.

Behaviour: the real driving distance and duration come from `computeRoutes` (with tolls when
Google provides an INR estimate). Results are cached for 15 minutes. Unknown addresses, missing
routes and provider errors are shown clearly, and the customer can still submit a request for a
manual quote. **Straight-line distance is never used.**

Without a key, the calculator runs in a clearly-labelled **manual distance** mode: the customer
enters an approximate one-way distance, travel time is assumed at 30 km/h, and the booking is
flagged *Quote needed* for staff to verify.

### Villages, cities and garages (Admin → Catalogue → Locations)

- Add every **village** (type `VILLAGE`, with the city/tehsil it belongs to) and **city** (type
  `CITY`) you serve. Customers pick pickup and venue from this list (they can still type a full
  address if theirs is missing). The slug is generated automatically.
- Places are looked up on Google as "Village, City, Nuh, Haryana, India" (`business.placesRegion`
  in `src/config/site.js`). If two villages share a name or Google picks the wrong one, fill in
  **Latitude / Longitude** (right-click the spot on Google Maps to copy them) and the exact point is used.
- Locations marked **Garage** are where the cars start. The seed adds Nuh, Firozpur Jhirka,
  Punhana and Tauru. With `business.garageToGarage` on, the estimate adds the road distance from
  the **nearest garage** to the pickup and back from the venue (or pickup, for round trips), and
  shows each leg in the estimate. Set it to `false` to bill only the customer's own route.
- The homepage "Serving …" line lists only `CITY` locations.

---

## Payments (Razorpay)

1. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test keys first).
2. In the Razorpay dashboard add a webhook to `https://<your-domain>/api/payments/webhook` with
   events `payment.captured`, `payment.failed`, `refund.processed`, and set its secret as
   `RAZORPAY_WEBHOOK_SECRET`.

Flow: a customer can pay only when the booking's advance is **approved** — automatically for
live-route bookings that need no manual review (`business.allowInstantAdvance`), or by staff in
Admin → Booking → *Approve advance payment*. The server creates the order for the amount stored
on the booking, and records success **only** after verifying the HMAC signature (checkout
callback) or a signed webhook. Reaching a success URL never marks anything paid. Capture is
idempotent, so the callback and webhook cannot double-count.

Offline payments (UPI, bank transfer, cash…) and refunds are recorded by admins with a reference.
**Revenue on the dashboard = verified payments net of refunds**, never unconfirmed requests.
A printable payment receipt is available to customers once a payment is recorded.

---

## Notifications

Templates in [src/lib/notify.js](src/lib/notify.js): booking received, confirmed, payment received,
rescheduled, cancelled, upcoming-event reminder. Every attempt is logged (Sent / Failed / Skipped)
and visible on the admin booking page.

- **Email** — [Resend](https://resend.com): set `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM` (a verified
  sender) and optionally `EMAIL_ADMIN_TO` for new-request alerts.
- **WhatsApp** — Meta WhatsApp Cloud API: set `WHATSAPP_PROVIDER_TOKEN` and
  `WHATSAPP_PHONE_NUMBER_ID`. Free-form messages only deliver inside a 24-hour customer-initiated
  window; for proactive messages, register approved templates and switch the call to a
  `template` message.
- **Reminders** — call daily:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/reminders`

---

## Admin

`/admin` is protected server-side: every admin page renders through a layout that checks the
signed session and role, and every admin API calls `requireAdminApi()`. Roles: `ADMIN` (full),
`STAFF` (everything except deleting catalogue items, recording payments/refunds and exporting).

- **Bookings** — search/filter, confirm (reserves the car for the date under a unique database
  constraint, so a car can never be confirmed twice on one day), assign car and crew (crew
  capacity per date is enforced), reschedule (moves the reservation atomically), cancel (releases
  it), update the quote (recorded as an adjustment line), approve the advance, add internal notes,
  record payments and refunds, export CSV.
- **Cars** — details, full pricing rule, image uploads (JPEG/PNG/WebP ≤ 5 MB, verified by file
  signature), block/unblock dates.
- **Catalogue** — decorations, add-ons, photography/film packages, combined packages, coupons,
  portfolio, vendors & crew, reviews (publish only genuine ones), service locations, categories.

Editing a sample record marks it as live data (the "Sample" labels disappear). All changes are
audit-logged. Public pages refresh immediately after admin edits.

---

## Database

Prisma schema: [prisma/schema.prisma](prisma/schema.prisma). Local development uses **SQLite** so
the project runs with zero setup. For production use **PostgreSQL**:

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `schema.prisma`.
2. Set `DATABASE_URL` to your Postgres URL.
3. `npx prisma migrate dev --name init` (locally) → commit `prisma/migrations` →
   `npx prisma migrate deploy` in production.
4. `npm run db:seed` once (or create your own data in the admin).

All field types are portable. Statuses are plain strings documented in the schema. Money is stored
as whole rupees.

---

## Deployment

Any Node.js host works (VPS, Railway, Render, Fly.io, Vercel):

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start
```

- The database must be reachable at **build time** — public pages are pre-rendered and then
  revalidated every 5 minutes (ISR).
- Run behind a reverse proxy that sets `X-Real-IP` (Vercel and most hosts do) so rate limiting
  sees real client IPs. The built-in rate limiter is in-memory; use Redis for multi-instance setups.
- **Uploads** are written to `UPLOAD_DIR` (default `./uploads`), which must be persistent. On
  serverless hosts (e.g. Vercel) switch to object storage (S3/R2) in
  `src/app/api/admin/cars/[id]/images/route.js`.
- Set `NEXT_PUBLIC_SITE_URL` to the production domain.

---

## Testing

```bash
npm test         # pricing engine unit tests
npm run lint
npm run build
```

Verified during development (against a running server): validation errors, past-date rejection,
concurrent duplicate submissions returning one booking, server-side price recomputation, guest
link and lookup access control, admin 401/403 protection, car double-booking blocked with 409,
reschedule moving reservations, forged payment callbacks and unsigned webhooks rejected,
offline payment recording, CSV export, mobile layouts (no horizontal overflow at 390 px), and a
full browser-driven booking from details to confirmation.

---

## Project structure

```
prisma/                 schema + demo seed
public/images/          optimised local images (see CREDITS.md)
scripts/                create-admin
src/app/(site)/         public pages (home, cars, photography, packages, booking, account, policies)
src/app/admin/          admin login + protected panel
src/app/api/            route handlers (quote, bookings, payments, auth, admin, uploads, cron)
src/components/         ui, layout, home, cars, booking, photography, account, admin
src/config/             site/brand settings, content, admin field definitions
src/lib/                pricing, quote service, maps, auth, validation, payments, notifications
tests/                  pricing unit tests
```

---

## Launch checklist

- [ ] Set real contact details, entity name, GSTIN and jurisdiction in `src/config/site.js`.
- [ ] Confirm tax rate, advance %, and outstation threshold with your accountant.
- [ ] Replace or edit every **Sample** car, package, decoration and add-on with real data and prices.
- [ ] Upload photographs of your actual vehicles; replace the portfolio with your own work.
- [ ] Have the Terms, Privacy and Cancellation templates completed and reviewed by a professional.
- [ ] Delete the inactive `DEMO10` coupon.
- [ ] Add service locations (Admin → Catalogue) and genuine, consented reviews only.
- [ ] Switch to PostgreSQL, set a strong `AUTH_SECRET`, change the admin password.
- [ ] Configure Maps, Razorpay (+ webhook), email and WhatsApp; check Admin → Integrations.
- [ ] Schedule the daily reminder cron.

Image credits: [public/images/CREDITS.md](public/images/CREDITS.md) (Unsplash License).
#   R o y a l - W e d d i n g s  
 