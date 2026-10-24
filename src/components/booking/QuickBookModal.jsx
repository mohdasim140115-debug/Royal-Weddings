"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X, Check, ArrowRight, ArrowLeft, ArrowRightLeft, MapPin, Flag, CalendarDays, Loader2, AlertTriangle, CarFront, CheckCircle2 } from "lucide-react";
import { PlaceCombobox } from "@/components/ui/PlacePicker";
import { RouteSummary } from "./EstimatePanel";
import { formatINR } from "@/lib/format";

let carsPromise;
function loadCars() {
  carsPromise ??= fetch("/api/cars")
    .then((r) => (r.ok ? r.json() : { cars: [] }))
    .catch(() => {
      carsPromise = undefined;
      return { cars: [] };
    });
  return carsPromise;
}

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

const EVENT_TYPES = ["Wedding", "Baraat", "Reception", "Engagement", "Mehendi", "Haldi", "Sangeet", "Pre-wedding shoot", "Other"];

const field = "w-full rounded-md border border-line bg-white px-3 py-2.5 text-[0.92rem] text-ink placeholder:text-stone/70 focus:border-navy focus:outline-none aria-[invalid=true]:border-danger";
const label = "mb-1.5 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-charcoal";
const primaryBtn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-navy px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory hover:bg-navy-soft disabled:opacity-60";

function Step({ n, children }) {
  return (
    <legend className={label}>
      <span className="flex size-5 items-center justify-center rounded-full bg-navy text-[0.6rem] text-ivory">{n}</span> {children}
    </legend>
  );
}

function FieldError({ id, msg }) {
  return msg ? (
    <p id={id} role="alert" className="mt-1 text-xs text-danger">
      {msg}
    </p>
  ) : null;
}

/**
 * Quick booking in a modal: pick a car and from-village → to-village, see the
 * server-computed price, then enter contact details and submit the booking
 * request without leaving the page.
 */
export default function QuickBookModal({ open, onClose, initialCar = "" }) {
  const [cars, setCars] = useState([]);
  const [mapsLive, setMapsLive] = useState(null);
  const [step, setStep] = useState("trip"); // trip → details → done
  const [car, setCar] = useState(initialCar);
  const [from, setFrom] = useState({ text: "", placeId: null });
  const [to, setTo] = useState({ text: "", placeId: null });
  const [tripType, setTripType] = useState("ONE_WAY");
  const [date, setDate] = useState("");
  const [manualKm, setManualKm] = useState("");
  const [result, setResult] = useState({ loading: false, data: null, error: "", key: "" });
  const [contact, setContact] = useState({ customerName: "", phone: "", email: "", pickupTime: "10:00", eventType: "Wedding", acceptTerms: false });
  const [submit, setSubmit] = useState({ loading: false, error: "", fields: {}, booking: null });
  const idempotencyKey = useRef("");
  const closeBtn = useRef(null);

  useEffect(() => {
    if (!open) return;
    loadCars().then((d) => {
      setCars(d.cars || []);
      if (typeof d.mapsLive === "boolean") setMapsLive(d.mapsLive);
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // A shown price belongs to the exact inputs it was computed for; once any
  // input changes it is hidden until the customer asks again.
  // (The date only matters for availability, which the server checks on submit.)
  const inputKey = JSON.stringify([car, from.text, from.placeId, to.text, to.placeId, tripType, manualKm]);
  const state = result.key === inputKey || result.loading ? result : { loading: false, data: null, error: "" };
  const ready = car && from.text.trim() && to.text.trim();

  const tripInput = () => ({
    pickup: from.text,
    pickupPlaceId: from.placeId,
    venue: to.text,
    venuePlaceId: to.placeId,
    tripType,
    pickupTime: contact.pickupTime || "10:00",
    waitingHours: 3,
    passengers: 1,
    manualKm: manualKm === "" ? null : Number(manualKm),
  });

  async function getPrice(e) {
    e?.preventDefault();
    if (!ready) {
      setResult({ loading: false, data: null, error: !car ? "Pehle car chuniye." : "Kahan se aur kahan tak — dono bhariye.", key: inputKey });
      return;
    }
    setResult({ loading: true, data: null, error: "", key: inputKey });
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceType: "CAR", eventDate: date || undefined, car: { slug: car }, trip: tripInput() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Price nahi nikal paaya. Dobara koshish karein.");
      setMapsLive(data.mapsLive);
      setResult({ loading: false, data, error: "", key: inputKey });
    } catch (err) {
      setResult({ loading: false, data: null, error: err.message, key: inputKey });
    }
  }

  async function book(e) {
    e.preventDefault();
    const fields = {};
    if (!date) fields.eventDate = "Shaadi ki tareekh chuniye.";
    if (contact.customerName.trim().length < 2) fields.customerName = "Apna poora naam likhiye.";
    if (!/^[+\d\s-]{10,16}$/.test(contact.phone.trim())) fields.phone = "Sahi mobile number likhiye, jaise 98765 43210.";
    if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) fields.email = "Sahi email likhiye.";
    if (!contact.acceptTerms) fields.acceptTerms = "Terms aur cancellation policy maaniye.";
    if (Object.keys(fields).length) {
      setSubmit((s) => ({ ...s, error: "Laal wale khaane theek kijiye.", fields }));
      return;
    }
    idempotencyKey.current ||= crypto.randomUUID();
    setSubmit({ loading: true, error: "", fields: {}, booking: null });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          quoteInput: { serviceType: "CAR", eventDate: date, car: { slug: car }, trip: tripInput() },
          contact: { customerName: contact.customerName, phone: contact.phone, email: contact.email },
          eventType: contact.eventType,
          acceptTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmit({ loading: false, error: data.error || "Booking nahi ho paayi. Dobara koshish karein.", fields: data.fields || {}, booking: null });
        return;
      }
      setSubmit({ loading: false, error: "", fields: {}, booking: data });
      setStep("done");
    } catch {
      setSubmit({ loading: false, error: "Internet ki dikkat — dobara koshish karein.", fields: {}, booking: null });
    }
  }

  if (!open) return null;
  const quote = state.data?.quote;
  const hasPrice = quote && quote.sections?.length > 0 && state.data.route;
  // Editing a field clears its error message.
  const clearErr = (k) => setSubmit((st) => (st.fields[k] ? { ...st, fields: { ...st.fields, [k]: undefined } } : st));
  const setC = (k) => (e) => {
    setContact((c) => ({ ...c, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    clearErr(k);
  };
  const err = submit.fields;
  const selectedCar = cars.find((c) => c.slug === car);
  const lockedCar = initialCar ? cars.find((c) => c.slug === initialCar) : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="qb-title" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-ivory text-ink shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <div>
            <h2 id="qb-title" className="font-display text-2xl leading-none">
              {step === "done" ? "Booking request mil gayi" : "Book your wedding car"}
            </h2>
            <p className="mt-1 text-xs text-stone">
              {step === "trip" && (initialCar ? "Kahan se kahan tak chuniye — price turant dekhiye." : "Car chuniye, kahan se kahan tak — price turant dekhiye.")}
              {step === "details" && "Bas apni jaankari bhariye — booking ho jayegi."}
              {step === "done" && "Hum jaldi aapse sampark karke confirm karenge."}
            </p>
          </div>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="inline-flex size-10 items-center justify-center rounded-full text-charcoal hover:bg-sand">
            <X className="size-5" />
          </button>
        </div>

        {step === "trip" && (
          <>
            <form onSubmit={getPrice} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <fieldset>
                <Step n={1}>{lockedCar ? "Aapki car" : "Car chuniye"}</Step>
                {cars.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-stone">
                    <Loader2 className="size-4 animate-spin" /> Gaadiyan aa rahi hain…
                  </p>
                ) : lockedCar ? (
                  // Opened from a specific car's "Book" button: show only that car.
                  <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-navy bg-white ring-2 ring-navy">
                    <span className="relative block aspect-[16/10] w-32 shrink-0 bg-sand sm:w-44">
                      {lockedCar.image ? <Image src={lockedCar.image.url} alt="" fill sizes="176px" className="object-cover" /> : <CarFront className="absolute inset-0 m-auto size-8 text-stone" />}
                    </span>
                    <span className="min-w-0 py-2 pr-3">
                      <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-stone">{lockedCar.make}</span>
                      <span className="block text-lg font-semibold leading-tight">{lockedCar.model}</span>
                      <span className="block text-[0.78rem] text-navy">From {lockedCar.from}</span>
                      {lockedCar.fromNote && <span className="block text-[0.7rem] text-stone">{lockedCar.fromNote}</span>}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {cars.map((c) => {
                      const active = car === c.slug;
                      return (
                        <label key={c.slug} className={`relative cursor-pointer overflow-hidden rounded-xl border bg-white transition-all ${active ? "border-navy ring-2 ring-navy" : "border-line hover:border-navy/40"}`}>
                          <input type="radio" name="qb-car" value={c.slug} checked={active} onChange={() => setCar(c.slug)} className="sr-only" />
                          <span className="relative block aspect-[16/10] bg-sand">
                            {c.image ? <Image src={c.image.url} alt="" fill sizes="(min-width: 640px) 200px, 45vw" className="object-cover" /> : <CarFront className="absolute inset-0 m-auto size-8 text-stone" />}
                            {active && (
                              <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-navy text-ivory">
                                <Check className="size-3.5" />
                              </span>
                            )}
                          </span>
                          <span className="block px-2.5 py-2">
                            <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-stone">{c.make}</span>
                            <span className="block text-sm font-semibold">{c.model}</span>
                            <span className="block text-[0.72rem] text-navy">From {c.from}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              <fieldset className="space-y-3">
                <Step n={2}>Kahan se kahan tak</Step>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="qb-from" className={label}>
                      <MapPin className="size-3.5" /> Kahan se (gaon / shehar)
                    </label>
                    <PlaceCombobox value={from.text} placeId={from.placeId} onChange={setFrom} placeholder="Jaise: Punhana" inputClassName={field} inputProps={{ id: "qb-from" }} />
                  </div>
                  <div>
                    <label htmlFor="qb-to" className={label}>
                      <Flag className="size-3.5" /> Kahan tak (shaadi ki jagah)
                    </label>
                    <PlaceCombobox value={to.text} placeId={to.placeId} onChange={setTo} placeholder="Jaise: Tauru" inputClassName={field} inputProps={{ id: "qb-to" }} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Journey">
                    {[
                      { v: "ONE_WAY", t: "One way", Icon: ArrowRight },
                      { v: "ROUND_TRIP", t: "Aana-jaana", Icon: ArrowRightLeft },
                    ].map(({ v, t, Icon }) => (
                      <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border text-sm transition-colors ${tripType === v ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-navy/40"}`}>
                        <input type="radio" name="qb-trip" value={v} checked={tripType === v} onChange={() => setTripType(v)} className="sr-only" />
                        <Icon className="size-4" /> {t}
                      </label>
                    ))}
                  </div>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" />
                    <input id="qb-date" type="date" min={todayIST()} value={date} onChange={(e) => setDate(e.target.value)} className={`${field} pl-9`} aria-label="Shaadi ki tareekh" />
                  </div>
                </div>
                {mapsLive === false && (
                  <div className="rounded-md border border-champagne-soft bg-white p-3">
                    <label htmlFor="qb-km" className={label}>
                      Lagbhag doori (km, ek taraf)
                    </label>
                    <input id="qb-km" type="number" min={1} max={2000} value={manualKm} onChange={(e) => setManualKm(e.target.value)} className={`${field} sm:w-48`} placeholder="Jaise: 35" />
                    <p className="mt-1.5 text-[0.7rem] text-stone">Live doori abhi chalu nahi hai — andaza daaliye, hum confirm karne se pehle check karenge.</p>
                  </div>
                )}
              </fieldset>

              {state.error && (
                <p role="alert" className="flex items-start gap-2 rounded-md bg-burgundy-soft px-3 py-2 text-sm text-burgundy">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {state.error}
                </p>
              )}

              {state.data && (
                <section aria-live="polite" className="space-y-3 rounded-xl border border-navy/15 bg-white p-4">
                  {state.data.routeError && (
                    <p className="flex gap-2 text-sm text-burgundy">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {state.data.routeError.message}
                    </p>
                  )}
                  <RouteSummary route={state.data.route} distanceSource={state.data.distanceSource} />
                  {hasPrice ? (
                    <div>
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone">Estimated total ({state.data.car?.name})</p>
                      <p className="font-display text-4xl leading-none text-navy">{formatINR(quote.total)}</p>
                      <p className="mt-1 text-xs text-stone">GST shaamil · Advance {formatINR(quote.advance ?? 0)} · Toll & parking actual</p>
                    </div>
                  ) : (
                    !state.data.routeError && <p className="text-sm text-stone">{mapsLive === false ? "Upar lagbhag doori (km) daal kar dobara price dekhiye." : "Is route ka price hum aapko confirm karke batayenge."}</p>
                  )}
                </section>
              )}
            </form>

            <div className="flex justify-end border-t border-line bg-white px-5 py-4">
              {hasPrice ? (
                <button type="button" onClick={() => setStep("details")} className={`${primaryBtn} w-full sm:w-auto`}>
                  Booking karein <ArrowRight className="size-4" />
                </button>
              ) : (
                <button type="button" onClick={getPrice} disabled={state.loading} className={`${primaryBtn} w-full sm:w-auto`}>
                  {state.loading && <Loader2 className="size-4 animate-spin" />} Price dekhiye
                </button>
              )}
            </div>
          </>
        )}

        {step === "details" && (
          <>
            <form id="qb-details" onSubmit={book} noValidate className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-navy/15 bg-white p-3">
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{selectedCar ? `${selectedCar.make} ${selectedCar.model}` : state.data?.car?.name}</p>
                  <p className="truncate text-xs text-stone">
                    {from.text} → {to.text} · {tripType === "ROUND_TRIP" ? "Aana-jaana" : "One way"}
                  </p>
                </div>
                <p className="shrink-0 font-display text-2xl text-navy">{quote ? formatINR(quote.total) : ""}</p>
              </div>

              <fieldset className="grid gap-3 sm:grid-cols-2">
                <Step n={3}>Aapki jaankari</Step>
                <div className="sm:col-span-2">
                  <label htmlFor="qb-name" className={label}>Poora naam *</label>
                  <input id="qb-name" autoComplete="name" value={contact.customerName} onChange={setC("customerName")} className={field} aria-invalid={err.customerName ? "true" : undefined} aria-describedby="qb-name-err" />
                  <FieldError id="qb-name-err" msg={err.customerName} />
                </div>
                <div>
                  <label htmlFor="qb-phone" className={label}>Mobile number *</label>
                  <input id="qb-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={contact.phone} onChange={setC("phone")} className={field} aria-invalid={err.phone ? "true" : undefined} aria-describedby="qb-phone-err" />
                  <FieldError id="qb-phone-err" msg={err.phone} />
                </div>
                <div>
                  <label htmlFor="qb-email" className={label}>Email *</label>
                  <input id="qb-email" type="email" autoComplete="email" value={contact.email} onChange={setC("email")} className={field} aria-invalid={err.email ? "true" : undefined} aria-describedby="qb-email-err" />
                  <FieldError id="qb-email-err" msg={err.email} />
                </div>
                <div>
                  <label htmlFor="qb-date2" className={label}>Shaadi ki tareekh *</label>
                  <input id="qb-date2" type="date" min={todayIST()} value={date} onChange={(e) => { setDate(e.target.value); clearErr("eventDate"); }} className={field} aria-invalid={err.eventDate ? "true" : undefined} aria-describedby="qb-date2-err" />
                  <FieldError id="qb-date2-err" msg={err.eventDate} />
                </div>
                <div>
                  <label htmlFor="qb-time" className={label}>Pickup ka samay</label>
                  <input id="qb-time" type="time" value={contact.pickupTime} onChange={setC("pickupTime")} className={field} aria-invalid={err.pickupTime ? "true" : undefined} />
                  <FieldError msg={err.pickupTime} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="qb-event" className={label}>Mauka</label>
                  <select id="qb-event" value={contact.eventType} onChange={setC("eventType")} className={field}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-start gap-2.5 text-sm sm:col-span-2">
                  <input type="checkbox" checked={contact.acceptTerms} onChange={setC("acceptTerms")} className="mt-0.5 size-4 accent-[#09243d]" aria-invalid={err.acceptTerms ? "true" : undefined} />
                  <span>
                    Main{" "}
                    <Link href="/terms" target="_blank" className="text-navy underline underline-offset-2">terms</Link> aur{" "}
                    <Link href="/cancellation-policy" target="_blank" className="text-navy underline underline-offset-2">cancellation policy</Link> se sehmat hoon.
                  </span>
                </label>
                <FieldError msg={err.acceptTerms} />
              </fieldset>

              {submit.error && (
                <p role="alert" className="flex items-start gap-2 rounded-md bg-burgundy-soft px-3 py-2 text-sm text-burgundy">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {submit.error}
                </p>
              )}
              <p className="text-[0.7rem] text-stone">Abhi koi paisa nahi katega. Hum availability check karke confirm karenge.</p>
            </form>

            <div className="flex items-center justify-between gap-3 border-t border-line bg-white px-5 py-4">
              <button type="button" onClick={() => setStep("trip")} className="inline-flex min-h-12 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal hover:text-navy">
                <ArrowLeft className="size-4" /> Wapas
              </button>
              <button type="submit" form="qb-details" disabled={submit.loading} className={primaryBtn}>
                {submit.loading && <Loader2 className="size-4 animate-spin" />} Booking bhejiye
              </button>
            </div>
          </>
        )}

        {step === "done" && submit.booking && (
          <div className="flex-1 overflow-y-auto px-5 py-8 text-center">
            <CheckCircle2 className="mx-auto size-14 text-success" strokeWidth={1.5} />
            <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone">Aapka booking number</p>
            <p className="mt-1 font-display text-3xl tracking-wide text-navy">{submit.booking.reference}</p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-stone">
              Estimated total {formatINR(submit.booking.total)}. Hum jaldi call karke car aur tareekh confirm karenge. Yeh number sambhaal kar rakhiye.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href={submit.booking.url} onClick={onClose} className={primaryBtn}>
                Booking status dekhiye <ArrowRight className="size-4" />
              </Link>
              <button type="button" onClick={onClose} className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] hover:border-navy">
                Band karein
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
