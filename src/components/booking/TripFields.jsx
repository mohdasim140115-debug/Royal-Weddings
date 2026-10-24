"use client";

import { Plus, Trash2, ArrowRightLeft, ArrowRight } from "lucide-react";
import { Input, Select, Checkbox } from "@/components/ui/Field";
import PlaceInput from "@/components/ui/PlacePicker";

export const emptyTrip = {
  pickup: "",
  venue: "",
  pickupPlaceId: null,
  venuePlaceId: null,
  stops: [],
  tripType: "ONE_WAY",
  pickupTime: "",
  waitingHours: 3,
  passengers: 2,
  outstation: false,
  outstationDays: 1,
  manualKm: "",
};

export default function TripFields({ trip, onChange, errors = {}, mapsLive, maxSeats }) {
  const set = (k, v) => onChange({ ...trip, [k]: v });
  const setStop = (i, v) => set("stops", trip.stops.map((s, j) => (j === i ? v : s)));

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <PlaceInput
          label="Pickup — gaon / shehar"
          required
          value={trip.pickup}
          placeId={trip.pickupPlaceId}
          onChange={({ text, placeId }) => onChange({ ...trip, pickup: text, pickupPlaceId: placeId })}
          error={errors.pickup}
          placeholder="Gaon ya shehar ka naam likhein"
          hint="List mein nahi hai? Poora address likh dein."
        />
        <PlaceInput
          label="Shaadi ki jagah / destination"
          required
          value={trip.venue}
          placeId={trip.venuePlaceId}
          onChange={({ text, placeId }) => onChange({ ...trip, venue: text, venuePlaceId: placeId })}
          error={errors.venue}
          placeholder="Gaon, shehar ya venue"
        />
      </div>

      {trip.stops.map((s, i) => (
        <div key={i} className="flex items-end gap-2">
          <Input className="flex-1" label={`Stop ${i + 1}`} value={s} onChange={(e) => setStop(i, e.target.value)} placeholder="e.g. temple, studio or family home" />
          <button type="button" onClick={() => set("stops", trip.stops.filter((_, j) => j !== i))} className="inline-flex size-12 items-center justify-center border border-line text-stone hover:border-danger hover:text-danger" aria-label={`Remove stop ${i + 1}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      {trip.stops.length < 3 && (
        <button type="button" onClick={() => set("stops", [...trip.stops, ""])} className="inline-flex min-h-10 items-center gap-2 self-start text-xs font-semibold uppercase tracking-[0.14em] text-charcoal hover:text-champagne-deep">
          <Plus className="size-4" aria-hidden="true" /> Add a stop on the way
        </button>
      )}

      <fieldset>
        <legend className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-charcoal">Journey</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "ONE_WAY", label: "One way", Icon: ArrowRight, hint: "Pickup → venue" },
            { v: "ROUND_TRIP", label: "Round trip", Icon: ArrowRightLeft, hint: "Returns to pickup" },
          ].map(({ v, label, Icon, hint }) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="tripType" value={v} checked={trip.tripType === v} onChange={() => set("tripType", v)} className="peer sr-only" />
              <span className="flex min-h-14 items-center gap-3 border border-line bg-white px-4 transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-champagne-deep">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs opacity-70">{hint}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <Input label="Pickup time" required type="time" value={trip.pickupTime} onChange={(e) => set("pickupTime", e.target.value)} error={errors.pickupTime} />
        <Select label="Waiting at venue" value={trip.waitingHours} onChange={(e) => set("waitingHours", Number(e.target.value))} hint="Time the car waits for you">
          {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
            <option key={h} value={h}>
              {h === 0 ? "No waiting" : `${h} hour${h > 1 ? "s" : ""}`}
            </option>
          ))}
        </Select>
        <Input
          label="Passengers"
          type="number"
          min={1}
          max={maxSeats || 20}
          value={trip.passengers}
          onChange={(e) => set("passengers", e.target.value === "" ? "" : Number(e.target.value))}
          error={errors.passengers}
          hint={maxSeats ? `This car seats up to ${maxSeats}` : undefined}
        />
      </div>

      <div className="grid gap-4 border border-line bg-sand/40 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <Checkbox label="Outstation travel" description="Overnight or out-of-city journeys. Trips beyond 120 km one way are treated as outstation automatically." checked={trip.outstation} onChange={(e) => set("outstation", e.target.checked)} />
        {trip.outstation && (
          <Select label="Days" value={trip.outstationDays} onChange={(e) => set("outstationDays", Number(e.target.value))} className="sm:w-32">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d} day{d > 1 ? "s" : ""}
              </option>
            ))}
          </Select>
        )}
      </div>

      {!mapsLive && (
        <div className="border border-champagne/50 bg-champagne-soft/20 p-4">
          <p className="text-sm font-semibold text-ink">Live route calculation is not enabled</p>
          <p className="mt-1 text-xs leading-relaxed text-stone">
            Enter an approximate one-way driving distance for an estimate — we will verify the route before confirming. Or leave it blank to request a manual quote.
          </p>
          <Input className="mt-3 sm:w-64" label="Approx. one-way distance (km)" type="number" min={0} max={5000} step="1" value={trip.manualKm} onChange={(e) => set("manualKm", e.target.value)} />
        </div>
      )}
    </div>
  );
}
