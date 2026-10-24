"use client";

import { useState } from "react";
import { CalendarCheck, CalendarX, Loader2 } from "lucide-react";

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/**
 * Checks recorded reservations for a date. It never claims a car is
 * "available" — only that no reservation is recorded yet.
 */
export default function AvailabilityChecker({ slug }) {
  const [date, setDate] = useState("");
  const [state, setState] = useState({ status: "idle" });

  async function check(e) {
    e.preventDefault();
    if (!date) return;
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/cars/${slug}/availability?date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not check this date.");
      setState({ status: data.reserved ? "reserved" : "open" });
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  }

  return (
    <form onSubmit={check} className="border border-line bg-white p-5">
      <label htmlFor="avail-date" className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-charcoal">
        Check your date
      </label>
      <div className="mt-2 flex gap-2">
        <input id="avail-date" type="date" min={todayIST()} value={date} onChange={(e) => { setDate(e.target.value); setState({ status: "idle" }); }} className="field min-h-11 py-2" required />
        <button type="submit" className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-ink px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-60" disabled={state.status === "loading"}>
          {state.status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Check
        </button>
      </div>
      <div aria-live="polite" className="mt-3 text-sm">
        {state.status === "reserved" && (
          <p className="flex gap-2 text-burgundy">
            <CalendarX className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Already reserved on this date. Please choose another car or date.
          </p>
        )}
        {state.status === "open" && (
          <p className="flex gap-2 text-charcoal">
            <CalendarCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /> No reservation recorded for this date yet. Availability is confirmed by our team after you send a request.
          </p>
        )}
        {state.status === "error" && <p className="text-danger">{state.message}</p>}
      </div>
    </form>
  );
}
