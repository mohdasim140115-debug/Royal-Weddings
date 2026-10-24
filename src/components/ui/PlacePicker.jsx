"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Field } from "./Field";

// One shared request per page load for the admin-managed village / city list.
let placesPromise;
function loadPlaces() {
  placesPromise ??= fetch("/api/places")
    .then((r) => (r.ok ? r.json() : { places: [] }))
    .then((d) => d.places || [])
    .catch(() => {
      placesPromise = undefined;
      return [];
    });
  return placesPromise;
}

const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N} ]/gu, "").trim();

/**
 * Text box with suggestions from the village / city list. Picking a
 * suggestion sets `placeId`; typing freely clears it (Google then looks the
 * text up as an address).
 * onChange({ text, placeId })
 */
export function PlaceCombobox({ value, placeId, onChange, placeholder, inputClassName = "field", inputProps = {} }) {
  const [places, setPlaces] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrap = useRef(null);

  useEffect(() => {
    let alive = true;
    loadPlaces().then((p) => alive && setPlaces(p));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const close = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const matches = useMemo(() => {
    const q = norm(value || "");
    if (placeId && places.some((p) => p.id === placeId && p.label === value)) return [];
    const list = q ? places.filter((p) => norm(p.label).includes(q)) : places;
    // Names starting with the query first, then cities before villages.
    return list
      .map((p) => ({ p, rank: (norm(p.name).startsWith(q) ? 0 : 2) + (p.kind === "CITY" ? 0 : 1) }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 8)
      .map((x) => x.p);
  }, [value, placeId, places]);

  const pick = (p) => {
    onChange({ text: p.label, placeId: p.id });
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open || matches.length === 0) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && matches.length > 0;

  return (
    <div ref={wrap} className="relative">
      <input
        {...inputProps}
        className={inputClassName}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          onChange({ text: e.target.value, placeId: null });
          setActive(0);
          setOpen(true);
        }}
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute left-0 top-full z-40 mt-1 max-h-72 w-max min-w-full max-w-[min(22rem,85vw)] overflow-y-auto rounded-md border border-line bg-white py-1 text-left text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]">
          {matches.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm ${i === active ? "bg-sand" : ""}`}
            >
              <MapPin className="size-4 shrink-0 text-champagne-deep" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                {p.name}
                {p.parentCity && p.kind === "VILLAGE" && <span className="text-stone">, {p.parentCity}</span>}
              </span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-stone">{p.kind === "VILLAGE" ? "Gaon" : "Shehar"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Labelled version for forms (matches Input from ./Field). */
export default function PlaceInput({ label, error, hint, required, className, value, placeId, onChange, placeholder, id }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={id}>
      {(a) => <PlaceCombobox value={value} placeId={placeId} onChange={onChange} placeholder={placeholder} inputProps={a} />}
    </Field>
  );
}
