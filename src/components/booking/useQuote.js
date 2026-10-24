"use client";

import { useEffect, useRef, useState } from "react";

/** Builds the API payload from wizard/builder state. */
export function toQuoteInput(s) {
  return {
    serviceType: s.service,
    eventDate: s.event?.eventDate || null,
    trip: s.trip,
    car: s.car?.slug ? s.car : null,
    photo: s.photo || [],
    addOns: s.addOns || [],
    weddingPackageSlug: s.weddingPackageSlug || null,
    couponCode: s.couponCode || null,
  };
}

/**
 * Debounced live quote. Re-fetches whenever the serialised input changes
 * and ignores out-of-order responses.
 */
export function useQuote(input, { enabled = true, delay = 450 } = {}) {
  const [state, setState] = useState({ data: null, loading: false, error: null, field: null });
  const seq = useRef(0);
  const key = JSON.stringify(input);

  useEffect(() => {
    if (!enabled) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const res = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: key });
        const data = await res.json();
        if (id !== seq.current) return;
        if (!res.ok) setState({ data: null, loading: false, error: data.error || "Could not calculate an estimate.", field: data.field || null });
        else setState({ data, loading: false, error: null, field: null });
      } catch {
        if (id === seq.current) setState({ data: null, loading: false, error: "Network error — please check your connection.", field: null });
      }
    }, delay);
    return () => clearTimeout(t);
  }, [key, enabled, delay]);

  return state;
}
