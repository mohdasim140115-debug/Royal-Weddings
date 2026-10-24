"use client";

import Image from "next/image";
import { useState } from "react";
import { Users, Check, Minus, Plus, Car } from "lucide-react";
import { formatINR } from "@/lib/format";

const SERVICE_TYPE_LABEL = { PHOTOGRAPHY: "Photography", VIDEOGRAPHY: "Films", PHOTO_VIDEO: "Photo + film", PRE_WEDDING: "Pre-wedding" };

function Stepper({ label, value, onChange, max = 10 }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-charcoal">{label}</span>
      <div className="flex items-center border border-line bg-white">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="inline-flex size-9 items-center justify-center disabled:opacity-40" disabled={value <= 0} aria-label={`Decrease ${label}`}>
          <Minus className="size-3.5" />
        </button>
        <span className="w-8 text-center tabular-nums" aria-live="polite">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="inline-flex size-9 items-center justify-center disabled:opacity-40" disabled={value >= max} aria-label={`Increase ${label}`}>
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function CarPicker({ cars, value, onChange, error, allowNone = false }) {
  const [q, setQ] = useState("");
  const shown = cars.filter((c) => `${c.make} ${c.model} ${c.category.name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <fieldset>
      <legend className="sr-only">Choose a car</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="car-search" className="sr-only">Filter cars</label>
        <input id="car-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by make, model or type…" className="field sm:max-w-xs" />
        {allowNone && value && (
          <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold uppercase tracking-[0.14em] text-stone hover:text-burgundy">
            Remove car
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
      <div className="mt-4 grid max-h-[560px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {shown.map((c) => {
          const selected = value === c.slug;
          const p = c.pricing;
          const from = p?.baseFare ? formatINR(p.baseFare) : p?.extraKmRate ? `${formatINR(p.extraKmRate)}/km` : "On request";
          return (
            <label key={c.slug} className="cursor-pointer">
              <input type="radio" name="car" value={c.slug} checked={selected} onChange={() => onChange(c.slug)} className="peer sr-only" />
              <span className="flex gap-3 border border-line bg-white p-2.5 transition-colors peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-champagne-deep hover:border-ink/40">
                <span className="relative block h-20 w-28 shrink-0 overflow-hidden bg-sand">
                  {c.images[0] ? (
                    <Image src={c.images[0].url} alt="" fill sizes="112px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center"><Car className="size-6 text-champagne-deep/60" strokeWidth={1} /></span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.6rem] uppercase tracking-[0.14em] text-champagne-deep">{c.category.name}</span>
                  <span className="block truncate font-display text-lg leading-tight">{c.make} {c.model}</span>
                  <span className="mt-1 flex items-center gap-3 text-xs text-stone">
                    <span className="flex items-center gap-1"><Users className="size-3" aria-hidden="true" />{c.seats}</span>
                    <span>From {from}</span>
                  </span>
                </span>
                {selected && <Check className="size-4 shrink-0 text-ink" aria-hidden="true" />}
              </span>
            </label>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-stone">No cars match “{q}”.</p>}
      </div>
    </fieldset>
  );
}

export function DecorationPicker({ decorations, value, onChange, disabled }) {
  if (disabled) return <p className="text-sm text-stone">Decoration is not offered for this car.</p>;
  return (
    <fieldset>
      <legend className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-charcoal">Car decoration</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {[{ slug: null, name: "No decoration", description: "Car arrives clean and polished.", price: 0 }, ...decorations].map((d) => (
          <label key={d.slug || "none"} className="cursor-pointer">
            <input type="radio" name="decoration" checked={(value || null) === d.slug} onChange={() => onChange(d.slug)} className="peer sr-only" />
            <span className="flex h-full justify-between gap-3 border border-line bg-white p-4 transition-colors peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-champagne-deep">
              <span>
                <span className="block text-sm font-medium">{d.name}</span>
                <span className="mt-0.5 block text-xs text-stone">{d.description}</span>
              </span>
              <span className="shrink-0 text-sm tabular-nums">{d.slug ? formatINR(d.price) : "—"}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PackagePicker({ packages, value, onChange, types }) {
  const list = packages.filter((p) => !types || types.includes(p.serviceType));
  const selected = (slug) => value.find((v) => v.slug === slug);
  const toggle = (slug) => onChange(selected(slug) ? value.filter((v) => v.slug !== slug) : [...value, { slug, extraHours: 0, extraDays: 0 }].slice(0, 4));
  const update = (slug, patch) => onChange(value.map((v) => (v.slug === slug ? { ...v, ...patch } : v)));

  return (
    <fieldset>
      <legend className="sr-only">Photography and film packages</legend>
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((p) => {
          const sel = selected(p.slug);
          return (
            <div key={p.slug} className={`border bg-white transition-colors ${sel ? "border-ink ring-1 ring-ink" : "border-line"}`}>
              <label className="flex cursor-pointer gap-3 p-4">
                <input type="checkbox" checked={Boolean(sel)} onChange={() => toggle(p.slug)} className="mt-1 size-[18px] shrink-0 accent-[#151515]" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-xl leading-tight">{p.name}</span>
                    <span className="text-sm tabular-nums">{p.quoteOnly || p.price == null ? "On request" : formatINR(p.price)}</span>
                  </span>
                  <span className="mt-0.5 block text-[0.6rem] uppercase tracking-[0.14em] text-champagne-deep">
                    {SERVICE_TYPE_LABEL[p.serviceType]} · {p.hours} hrs{p.eventDays > 1 ? ` · ${p.eventDays} days` : ""}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-stone">{p.description}</span>
                </span>
              </label>
              {sel && !p.quoteOnly && (p.extraHourRate > 0 || p.extraDayRate > 0) && (
                <div className="space-y-2 border-t border-line bg-sand/40 px-4 py-3">
                  {p.extraHourRate > 0 && <Stepper label={`Extra hours (${formatINR(p.extraHourRate)}/hr)`} value={sel.extraHours} onChange={(n) => update(p.slug, { extraHours: n })} max={12} />}
                  {p.extraDayRate > 0 && <Stepper label={`Extra event days (${formatINR(p.extraDayRate)}/day)`} value={sel.extraDays} onChange={(n) => update(p.slug, { extraDays: n })} max={6} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AddOnPicker({ addOns, value, onChange, categories }) {
  const list = addOns.filter((a) => !categories || categories.includes(a.category));
  if (!list.length) return null;
  const qty = (slug) => value.find((v) => v.slug === slug)?.quantity || 0;
  const setQty = (slug, n) => onChange(n <= 0 ? value.filter((v) => v.slug !== slug) : value.some((v) => v.slug === slug) ? value.map((v) => (v.slug === slug ? { ...v, quantity: n } : v)) : [...value, { slug, quantity: n }]);
  const unit = { PER_HOUR: "/hr", PER_DAY: "/day", PER_UNIT: " each", FLAT: "" };

  return (
    <fieldset>
      <legend className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-charcoal">Additional services</legend>
      <ul className="divide-y divide-line border-y border-line">
        {list.map((a) => (
          <li key={a.slug} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{a.name}</p>
              <p className="text-xs text-stone">{a.description}</p>
            </div>
            {a.unit === "FLAT" ? (
              <label className="flex shrink-0 cursor-pointer items-center gap-3 text-sm">
                <span className="tabular-nums">{formatINR(a.price)}</span>
                <input type="checkbox" checked={qty(a.slug) > 0} onChange={(e) => setQty(a.slug, e.target.checked ? 1 : 0)} className="size-[18px] accent-[#151515]" aria-label={`Add ${a.name}`} />
              </label>
            ) : (
              <div className="shrink-0">
                <Stepper label={`${formatINR(a.price)}${unit[a.unit]}`} value={qty(a.slug)} onChange={(n) => setQty(a.slug, n)} max={10} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
