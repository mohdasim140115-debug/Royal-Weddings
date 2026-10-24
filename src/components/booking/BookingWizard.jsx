"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Car, Camera, Film, Sparkles, ArrowLeft, ArrowRight, Loader2, Check, Plus, Trash2, CircleCheck } from "lucide-react";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import TripFields, { emptyTrip } from "./TripFields";
import { CarPicker, DecorationPicker, PackagePicker, AddOnPicker } from "./ServicePickers";
import EstimatePanel, { RouteSummary } from "./EstimatePanel";
import PriceBreakdown from "./PriceBreakdown";
import PayButton from "./PayButton";
import { useQuote, toQuoteInput } from "./useQuote";
import { EVENT_TYPES, isEmail, isPhone } from "@/lib/validation";
import { formatINR, formatDate } from "@/lib/format";

const STEPS = ["Service", "Event details", "Selections", "Price summary", "Confirm"];

const SERVICES = [
  { v: "CAR", label: "Wedding car", body: "Chauffeur-driven car with optional décor", Icon: Car },
  { v: "PHOTOGRAPHY", label: "Photography", body: "Traditional, candid & pre-wedding", Icon: Camera },
  { v: "VIDEOGRAPHY", label: "Videography", body: "Cinematic films, reels & drone", Icon: Film },
  { v: "COMBINED", label: "Combined package", body: "Cars, décor, photos & films together", Icon: Sparkles },
];

const PACKAGE_TYPES = {
  PHOTOGRAPHY: ["PHOTOGRAPHY", "PHOTO_VIDEO", "PRE_WEDDING"],
  VIDEOGRAPHY: ["VIDEOGRAPHY", "PHOTO_VIDEO", "PRE_WEDDING"],
  COMBINED: null,
};

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function newKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

const CONTACT_FIELDS = ["customerName", "phone", "email", "eventDate", "eventType", "pickup", "venue", "pickupTime", "passengers"];

export default function BookingWizard({ catalog, initial, user, paymentsEnabled }) {
  const [step, setStep] = useState(initial.service ? 1 : 0);
  const [s, setS] = useState(() => ({
    service: initial.service || "CAR",
    contact: { customerName: user?.name || "", phone: user?.phone || "", email: user?.email || "" },
    event: { eventDate: initial.date || "", eventType: "Wedding", coverageHours: "", notes: "" },
    trip: { ...emptyTrip, pickup: initial.pickup || "", venue: initial.venue || "", pickupPlaceId: initial.pickupPlace || null, venuePlaceId: initial.venuePlace || null },
    car: { slug: initial.car || null, decorationSlug: initial.deco || null },
    photo: initial.photo || [],
    addOns: initial.addOns || [],
    weddingPackageSlug: initial.package || null,
    couponCode: "",
    events: [],
    acceptTerms: false,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);
  const [couponDraft, setCouponDraft] = useState("");
  const idemKey = useRef(null);
  const topRef = useRef(null);

  const patch = (k, v) => setS((prev) => ({ ...prev, [k]: typeof v === "function" ? v(prev[k]) : v }));
  const selectedCar = catalog.cars.find((c) => c.slug === s.car.slug) || null;
  const needsTrip = s.service === "CAR" || (s.service === "COMBINED" && Boolean(s.car.slug));
  const showPhoto = s.service !== "CAR";

  const quoteInput = useMemo(() => {
    const input = toQuoteInput(s);
    if (s.service === "PHOTOGRAPHY" || s.service === "VIDEOGRAPHY") input.car = null;
    if (s.service === "CAR") input.photo = [];
    return input;
  }, [s]);
  const hasSelection = (s.service === "CAR" && s.car.slug) || (showPhoto && s.photo.length > 0) || (s.service === "COMBINED" && s.car.slug);
  const quoteState = useQuote(quoteInput, { enabled: step >= 1 && Boolean(hasSelection) });

  function go(n) {
    setStep(n);
    setSubmitError("");
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function validate(n) {
    const e = {};
    if (n === 1) {
      if (s.contact.customerName.trim().length < 2) e.customerName = "Please enter your full name.";
      if (!isPhone(s.contact.phone)) e.phone = "Enter a valid mobile number, e.g. +91 98765 43210.";
      if (!isEmail(s.contact.email)) e.email = "Enter a valid email address.";
      if (!s.event.eventDate) e.eventDate = "Please choose the event date.";
      else if (s.event.eventDate < todayIST()) e.eventDate = "The date cannot be in the past.";
      if (needsTrip) {
        if (!s.trip.pickup.trim()) e.pickup = "Please enter the pickup address.";
        if (!s.trip.venue.trim()) e.venue = "Please enter the venue.";
        if (!s.trip.pickupTime) e.pickupTime = "Please choose a pickup time.";
        if (!(Number(s.trip.passengers) >= 1)) e.passengers = "At least one passenger.";
        if (selectedCar && Number(s.trip.passengers) > selectedCar.seats) e.passengers = `This car seats up to ${selectedCar.seats}.`;
      }
      s.events.forEach((ev, i) => {
        if (!ev.date || ev.date < todayIST()) e[`events.${i}.date`] = "Choose a valid date for this event.";
      });
    }
    if (n === 2) {
      if (s.service === "CAR" && !s.car.slug) e.car = "Please choose a car.";
      if ((s.service === "PHOTOGRAPHY" || s.service === "VIDEOGRAPHY") && s.photo.length === 0) e.photo = "Please choose at least one package.";
      if (s.service === "COMBINED" && !s.car.slug && s.photo.length === 0) e.services = "Add at least one service to your package.";
    }
    if (n === 4 && !s.acceptTerms) e.acceptTerms = "Please accept the terms and cancellation policy.";
    return e;
  }

  function next() {
    const e = validate(step);
    // A combined package that now includes a car needs the trip details from step 2.
    if (step === 2 && s.service === "COMBINED" && s.car.slug) {
      const tripErrors = validate(1);
      if (Object.keys(tripErrors).length) {
        setErrors(tripErrors);
        setSubmitError("Your package includes a car — please complete the pickup and venue details.");
        go(1);
        return;
      }
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step === 3 && quoteState.error) return;
    go(step + 1);
  }

  async function submit() {
    const e = validate(4);
    setErrors(e);
    if (Object.keys(e).length || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    idemKey.current ||= newKey();
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idemKey.current,
          quoteInput,
          contact: s.contact,
          eventType: s.event.eventType,
          coverageHours: s.event.coverageHours,
          notes: s.event.notes,
          events: showPhoto ? s.events : [],
          acceptTerms: s.acceptTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) {
          setErrors(data.fields);
          const keys = Object.keys(data.fields);
          if (keys.some((k) => CONTACT_FIELDS.includes(k) || k.startsWith("events."))) go(1);
          else if (keys.some((k) => ["car", "photo", "decoration", "services"].includes(k))) go(2);
        }
        throw new Error(data.error || "We couldn't submit your request.");
      }
      setResult(data);
      go(5);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Confirmation ─────────────────────────────────────────────
  if (step === 5 && result) {
    const q = quoteState.data?.quote;
    return (
      <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-28">
        <div className="border border-line bg-white p-8 text-center sm:p-12">
          <CircleCheck className="mx-auto size-12 text-success" strokeWidth={1.25} aria-hidden="true" />
          <p className="eyebrow mt-6 text-champagne-deep">Booking request received</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Thank you, {s.contact.customerName.split(" ")[0]}.</h2>
          <p className="mt-4 text-stone">Your reference number is</p>
          <p className="mt-1 font-display text-4xl tracking-wide">{result.reference}</p>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-charcoal">
            This is a booking <strong>request</strong>, not yet a confirmed reservation. We will verify availability{result.quoteRequired ? " and finalise your quote" : ""} and confirm with you by phone or email.
          </p>
          {paymentsEnabled && result.advanceApproved && result.advanceAmount > 0 && (
            <div className="mx-auto mt-8 max-w-md border-t border-line pt-8">
              <p className="text-sm text-charcoal">Optional: pay the advance now to prioritise your request. It is fully adjustable against your final invoice.</p>
              <div className="mt-4 flex justify-center">
                <PayButton reference={result.reference} token={result.token} amount={result.advanceAmount} />
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={result.url} className="inline-flex min-h-12 items-center justify-center bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory">
              View booking status
            </Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center border border-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em]">
              Back to home
            </Link>
          </div>
          <p className="mt-4 text-xs text-stone">Save this link — it lets you view your booking without an account.</p>
        </div>
        {q && (
          <div className="mt-6 border border-line bg-white p-6">
            <h3 className="text-2xl">Summary</h3>
            <p className="mt-1 text-sm text-stone">
              {s.event.eventType} · {formatDate(s.event.eventDate)}
            </p>
            <div className="mt-5">
              <PriceBreakdown quote={q} />
            </div>
          </div>
        )}
        <ol className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-3">
          {["We check availability with our fleet and crew.", "You receive a confirmed quote in writing.", "Your booking is confirmed once you approve and any advance is received."].map((t, i) => (
            <li key={t} className="bg-ivory p-5 text-sm text-charcoal">
              <span className="font-display text-2xl italic text-champagne-deep">0{i + 1}</span>
              <p className="mt-2">{t}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const estimateHint = !hasSelection ? "Choose a service to see your estimate." : null;

  return (
    <div ref={topRef} className="scroll-mt-28">
      {/* Progress */}
      <nav aria-label="Booking progress" className="mb-10">
        <ol className="flex gap-2 overflow-x-auto scrollbar-none">
          {STEPS.map((label, i) => (
            <li key={label} className="min-w-[120px] flex-1">
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i >= step}
                aria-current={i === step ? "step" : undefined}
                className="group w-full text-left disabled:cursor-default"
              >
                <span className={`block h-0.5 w-full transition-colors ${i <= step ? "bg-ink" : "bg-line"}`} />
                <span className={`mt-3 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${i === step ? "text-ink" : i < step ? "text-charcoal group-hover:text-champagne-deep" : "text-stone/70"}`}>
                  {i < step ? <Check className="size-3.5" aria-hidden="true" /> : <span className="tabular-nums">{i + 1}</span>}
                  {label}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="min-w-0">
          {submitError && step !== 4 && <Notice tone="warning" className="mb-6">{submitError}</Notice>}

          {/* Step 1: Service */}
          {step === 0 && (
            <section aria-labelledby="st-service">
              <h2 id="st-service" className="text-4xl">What would you like to book?</h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {SERVICES.map(({ v, label, body, Icon }) => (
                  <label key={v} className="cursor-pointer">
                    <input type="radio" name="service" value={v} checked={s.service === v} onChange={() => patch("service", v)} className="peer sr-only" />
                    <span className="flex h-full gap-4 border border-line bg-white p-6 transition-colors peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-champagne-deep hover:border-ink/40">
                      <Icon className="size-6 shrink-0 text-champagne-deep" strokeWidth={1.25} aria-hidden="true" />
                      <span>
                        <span className="block font-display text-2xl">{label}</span>
                        <span className="mt-1 block text-sm text-stone">{body}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Step 2: Event details */}
          {step === 1 && (
            <section aria-labelledby="st-details" className="grid gap-10">
              <div>
                <h2 id="st-details" className="text-4xl">Your details</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Input label="Full name" required value={s.contact.customerName} onChange={(e) => patch("contact", (c) => ({ ...c, customerName: e.target.value }))} error={errors.customerName} autoComplete="name" />
                  <Input label="Mobile number" required type="tel" value={s.contact.phone} onChange={(e) => patch("contact", (c) => ({ ...c, phone: e.target.value }))} error={errors.phone} autoComplete="tel" placeholder="+91 98765 43210" />
                  <Input className="sm:col-span-2" label="Email" required type="email" value={s.contact.email} onChange={(e) => patch("contact", (c) => ({ ...c, email: e.target.value }))} error={errors.email} autoComplete="email" />
                </div>
              </div>

              <div>
                <h3 className="text-3xl">The event</h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                  <Input label="Event date" required type="date" min={todayIST()} value={s.event.eventDate} onChange={(e) => patch("event", (ev) => ({ ...ev, eventDate: e.target.value }))} error={errors.eventDate} />
                  <Select label="Event type" required value={s.event.eventType} onChange={(e) => patch("event", (ev) => ({ ...ev, eventType: e.target.value }))} error={errors.eventType}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                  {showPhoto && (
                    <Input label="Coverage hours" type="number" min={1} max={24} value={s.event.coverageHours} onChange={(e) => patch("event", (ev) => ({ ...ev, coverageHours: e.target.value }))} hint="Approximate" />
                  )}
                </div>
              </div>

              {(s.service === "CAR" || s.service === "COMBINED") && (
                <div>
                  <h3 className="text-3xl">Journey</h3>
                  {s.service === "COMBINED" && <p className="mt-2 text-sm text-stone">Needed if your package includes a car.</p>}
                  <div className="mt-6">
                    <TripFields trip={s.trip} onChange={(t) => patch("trip", t)} errors={errors} mapsLive={catalog.mapsLive} maxSeats={selectedCar?.seats} />
                  </div>
                </div>
              )}

              {showPhoto && (
                <div>
                  <h3 className="text-3xl">Other events to cover</h3>
                  <p className="mt-2 text-sm text-stone">Add mehendi, haldi, sangeet or reception if you would like them covered.</p>
                  <div className="mt-5 grid gap-4">
                    {s.events.map((ev, i) => (
                      <div key={i} className="grid gap-4 border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_0.8fr_auto] sm:items-end">
                        <Select label="Event" value={ev.name} onChange={(e) => patch("events", (list) => list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}>
                          {EVENT_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </Select>
                        <Input label="Date" type="date" min={todayIST()} value={ev.date} onChange={(e) => patch("events", (list) => list.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} error={errors[`events.${i}.date`]} />
                        <Input label="Start" type="time" value={ev.startTime} onChange={(e) => patch("events", (list) => list.map((x, j) => (j === i ? { ...x, startTime: e.target.value } : x)))} />
                        <button type="button" onClick={() => patch("events", (list) => list.filter((_, j) => j !== i))} className="inline-flex size-12 items-center justify-center border border-line text-stone hover:text-danger" aria-label={`Remove ${ev.name}`}>
                          <Trash2 className="size-4" />
                        </button>
                        <Input className="sm:col-span-4" label="Venue" value={ev.venue} onChange={(e) => patch("events", (list) => list.map((x, j) => (j === i ? { ...x, venue: e.target.value } : x)))} />
                      </div>
                    ))}
                    {s.events.length < 6 && (
                      <button type="button" onClick={() => patch("events", (list) => [...list, { name: "Mehendi", date: "", startTime: "", venue: "", coverageHours: "" }])} className="inline-flex min-h-11 items-center gap-2 self-start border border-dashed border-ink/40 px-4 text-xs font-semibold uppercase tracking-[0.14em] hover:border-ink">
                        <Plus className="size-4" aria-hidden="true" /> Add an event
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Textarea label="Additional requirements" value={s.event.notes} onChange={(e) => patch("event", (ev) => ({ ...ev, notes: e.target.value }))} placeholder="Colour preferences, rituals to capture, access notes, special requests…" />
            </section>
          )}

          {/* Step 3: Selections */}
          {step === 2 && (
            <section aria-labelledby="st-select" className="grid gap-12">
              <h2 id="st-select" className="text-4xl">Choose your services</h2>
              {errors.services && <p role="alert" className="-mt-8 text-sm text-danger">{errors.services}</p>}

              {(s.service === "CAR" || s.service === "COMBINED") && (
                <div className="grid gap-8">
                  <div>
                    <h3 className="mb-4 text-2xl">{s.service === "COMBINED" ? "Wedding car (optional)" : "Wedding car"}</h3>
                    <CarPicker cars={catalog.cars} value={s.car.slug} error={errors.car} allowNone={s.service === "COMBINED"} onChange={(slug) => patch("car", (c) => ({ slug, decorationSlug: catalog.cars.find((x) => x.slug === slug)?.decorationAvailable ? c.decorationSlug : null }))} />
                  </div>
                  {s.car.slug && <DecorationPicker decorations={catalog.decorations} value={s.car.decorationSlug} disabled={!selectedCar?.decorationAvailable} onChange={(d) => patch("car", (c) => ({ ...c, decorationSlug: d }))} />}
                  {s.car.slug && <AddOnPicker addOns={catalog.addOns} categories={["CAR"]} value={s.addOns} onChange={(v) => patch("addOns", v)} />}
                </div>
              )}

              {showPhoto && (
                <div className="grid gap-8">
                  <div>
                    <h3 className="mb-4 text-2xl">{s.service === "COMBINED" ? "Photography & films" : "Choose a package"}</h3>
                    {errors.photo && <p role="alert" className="mb-3 text-sm text-danger">{errors.photo}</p>}
                    <PackagePicker packages={catalog.photoPackages} types={PACKAGE_TYPES[s.service]} value={s.photo} onChange={(v) => patch("photo", v)} />
                  </div>
                  <AddOnPicker addOns={catalog.addOns} categories={s.service === "COMBINED" ? ["PHOTO", "GENERAL"] : ["PHOTO", "GENERAL"]} value={s.addOns} onChange={(v) => patch("addOns", v)} />
                </div>
              )}
            </section>
          )}

          {/* Step 4: Price summary */}
          {step === 3 && (
            <section aria-labelledby="st-price" className="grid gap-8">
              <h2 id="st-price" className="text-4xl">Review your estimate</h2>
              {quoteState.loading && !quoteState.data && (
                <p className="flex items-center gap-2 text-stone"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Calculating your estimate…</p>
              )}
              {quoteState.error && <Notice tone="warning">{quoteState.error}</Notice>}
              {quoteState.data && (
                <>
                  {quoteState.data.routeError && <Notice tone="warning">{quoteState.data.routeError.message} You can still submit this request and we will quote manually.</Notice>}
                  <RouteSummary route={quoteState.data.route} distanceSource={quoteState.data.distanceSource} />
                  <div className="border border-line bg-white p-6">
                    <PriceBreakdown quote={quoteState.data.quote} />
                  </div>
                  <form
                    className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    onSubmit={(e) => {
                      e.preventDefault();
                      patch("couponCode", couponDraft.trim().toUpperCase());
                    }}
                  >
                    <Input className="flex-1" label="Coupon code" value={couponDraft} onChange={(e) => setCouponDraft(e.target.value)} error={s.couponCode ? quoteState.data.couponError : undefined} hint={s.couponCode && !quoteState.data.couponError ? `Coupon ${s.couponCode} applied.` : undefined} />
                    <button type="submit" className="inline-flex min-h-12 items-center justify-center border border-ink px-6 text-[0.72rem] font-semibold uppercase tracking-[0.16em] hover:bg-ink hover:text-ivory">
                      Apply
                    </button>
                    {s.couponCode && (
                      <button type="button" onClick={() => { patch("couponCode", ""); setCouponDraft(""); }} className="min-h-12 text-xs uppercase tracking-[0.14em] text-stone hover:text-danger">
                        Remove
                      </button>
                    )}
                  </form>
                </>
              )}
            </section>
          )}

          {/* Step 5: Confirm */}
          {step === 4 && (
            <section aria-labelledby="st-confirm" className="grid gap-8">
              <h2 id="st-confirm" className="text-4xl">Confirm your request</h2>
              <dl className="grid gap-px border border-line bg-line sm:grid-cols-2">
                {[
                  ["Name", s.contact.customerName],
                  ["Mobile", s.contact.phone],
                  ["Email", s.contact.email],
                  ["Event", `${s.event.eventType} · ${formatDate(s.event.eventDate)}`],
                  ...(needsTrip
                    ? [
                        ["Pickup", `${s.trip.pickup} at ${s.trip.pickupTime}`],
                        ["Venue", s.trip.venue],
                        ["Journey", `${s.trip.tripType === "ROUND_TRIP" ? "Round trip" : "One way"} · ${s.trip.passengers} passenger(s)${s.trip.stops.filter(Boolean).length ? ` · ${s.trip.stops.filter(Boolean).length} stop(s)` : ""}`],
                        ["Car", selectedCar ? `${selectedCar.make} ${selectedCar.model}` : "—"],
                      ]
                    : []),
                  ...(showPhoto && s.photo.length ? [["Packages", s.photo.map((p) => catalog.photoPackages.find((x) => x.slug === p.slug)?.name).join(", ")]] : []),
                  ...(s.events.length ? [["Other events", s.events.map((e) => `${e.name} (${formatDate(e.date)})`).join(", ")]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="bg-white p-4">
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-stone">{k}</dt>
                    <dd className="mt-1 break-words text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
              {quoteState.data && (
                <p className="flex items-baseline justify-between border-y border-ink py-4">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em]">Estimated total</span>
                  <span className="font-display text-3xl">{formatINR(quoteState.data.quote.total)}</span>
                </p>
              )}
              <Checkbox
                checked={s.acceptTerms}
                onChange={(e) => patch("acceptTerms", e.target.checked)}
                error={errors.acceptTerms}
                label={
                  <>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="underline decoration-champagne underline-offset-4">terms of service</Link> and{" "}
                    <Link href="/cancellation-policy" target="_blank" className="underline decoration-champagne underline-offset-4">cancellation policy</Link>.
                  </>
                }
                description="I understand this is a booking request and the price is an estimate until confirmed."
              />
              {submitError && <Notice tone="warning">{submitError}</Notice>}
            </section>
          )}

          {/* Navigation */}
          <div className="mt-12 flex items-center justify-between gap-4 border-t border-line pt-6">
            {step > 0 ? (
              <button type="button" onClick={() => go(step - 1)} className="inline-flex min-h-12 items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-charcoal hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden="true" /> Back
              </button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <button type="button" onClick={next} disabled={step === 3 && (quoteState.loading || Boolean(quoteState.error))} className="inline-flex min-h-12 items-center gap-2 bg-ink px-7 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory hover:bg-charcoal disabled:opacity-50">
                Continue <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting} className="inline-flex min-h-12 items-center gap-2 bg-burgundy px-7 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory hover:bg-[#561a2a] disabled:opacity-60">
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {submitting ? "Submitting…" : "Submit booking request"}
              </button>
            )}
          </div>
        </div>

        {/* Live estimate */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          {step >= 1 ? (
            <EstimatePanel quoteState={hasSelection ? quoteState : { data: null, loading: false, error: null }} waitingFor={estimateHint || "Your estimate will appear here."} />
          ) : (
            <div className="border border-line bg-sand/60 p-6 text-sm leading-relaxed text-stone">
              <p className="font-display text-2xl text-ink">Transparent by design</p>
              <p className="mt-3">You will see every charge — distance, time, allowances, décor, packages and tax — before you submit anything.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
