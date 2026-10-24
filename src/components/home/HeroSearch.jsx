"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Flag, CalendarDays, CarFront, ChevronDown, ArrowRight } from "lucide-react";
import { PlaceCombobox } from "@/components/ui/PlacePicker";

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function Cell({ icon: Icon, label, htmlFor, children, className = "" }) {
  return (
    <div className={`relative flex items-center gap-4 px-5 py-4 lg:px-6 ${className}`}>
      <Icon className="size-7 shrink-0 text-navy" strokeWidth={1.4} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className="block text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

const input = "mt-1 w-full bg-transparent text-[0.95rem] text-ink placeholder:text-stone/70 focus:outline-none";

/** Hero search. Choosing a car goes straight to booking; otherwise it opens the fleet. */
export default function HeroSearch({ cars = [], idPrefix = "hs" }) {
  const router = useRouter();
  const [form, setForm] = useState({ pickup: "", pickupPlace: null, venue: "", venuePlace: null, date: "", car: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    if (form.date && form.date < todayIST()) {
      setError("Please choose a date from today onwards.");
      return;
    }
    setError("");
    const q = new URLSearchParams();
    if (form.pickup) q.set("pickup", form.pickup);
    if (form.venue) q.set("venue", form.venue);
    if (form.pickupPlace) q.set("pickupPlace", form.pickupPlace);
    if (form.venuePlace) q.set("venuePlace", form.venuePlace);
    if (form.date) q.set("date", form.date);
    if (form.car) {
      q.set("service", "CAR");
      q.set("car", form.car);
      router.push(`/booking?${q}`);
    } else {
      router.push(`/cars?${q}`);
    }
  }

  return (
    <form onSubmit={submit} aria-label="Search wedding cars" className="rounded-xl bg-white text-ink shadow-[0_24px_60px_-24px_rgba(21,21,21,0.45)]">
      <div className="grid grid-cols-2 lg:grid-cols-[1.15fr_1.15fr_1fr_1.05fr_auto] lg:items-center lg:py-3">
        <Cell icon={MapPin} label="Pickup location" htmlFor={`${idPrefix}-pickup`} className="col-span-2 border-b border-line sm:col-span-1 sm:border-r lg:border-b-0">
          <PlaceCombobox value={form.pickup} placeId={form.pickupPlace} onChange={({ text, placeId }) => setForm((f) => ({ ...f, pickup: text, pickupPlace: placeId }))} placeholder="Gaon ya shehar" inputClassName={input} inputProps={{ id: `${idPrefix}-pickup` }} />
        </Cell>
        <Cell icon={Flag} label="Destination" htmlFor={`${idPrefix}-venue`} className="col-span-2 border-b border-line sm:col-span-1 lg:border-b-0 lg:border-r">
          <PlaceCombobox value={form.venue} placeId={form.venuePlace} onChange={({ text, placeId }) => setForm((f) => ({ ...f, venue: text, venuePlace: placeId }))} placeholder="Shaadi ki jagah" inputClassName={input} inputProps={{ id: `${idPrefix}-venue` }} />
        </Cell>
        <Cell icon={CalendarDays} label="Wedding date" htmlFor={`${idPrefix}-date`} className="col-span-2 border-b border-line sm:col-span-1 sm:border-b-0 sm:border-r">
          <input id={`${idPrefix}-date`} type="date" min={todayIST()} className={input} value={form.date} onChange={set("date")} />
        </Cell>
        <Cell icon={CarFront} label="Car type" htmlFor={`${idPrefix}-car`} className="col-span-2 sm:col-span-1 lg:border-r lg:border-line">
          <div className="relative">
            <select id={`${idPrefix}-car`} className={`${input} cursor-pointer appearance-none pr-6`} value={form.car} onChange={set("car")}>
              <option value="">Any Car Type</option>
              {cars.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.make} {c.model}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-charcoal" aria-hidden="true" />
          </div>
        </Cell>
        <div className="col-span-2 border-t border-line p-3 lg:col-span-1 lg:border-t-0 lg:px-5 lg:py-1">
          <button
            type="submit"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-navy px-9 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-ink"
          >
            Search Cars
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="border-t border-line px-6 py-2.5 text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
