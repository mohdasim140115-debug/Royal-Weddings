"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Notice from "@/components/ui/Notice";

const label = "mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-charcoal";
const btn = "inline-flex min-h-10 items-center justify-center gap-2 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] disabled:opacity-50";

function useAction(url) {
  const router = useRouter();
  const [state, setState] = useState({ busy: false, error: "", ok: "" });
  async function run(body, okMessage = "Saved.") {
    setState({ busy: true, error: "", ok: "" });
    try {
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed.");
      setState({ busy: false, error: "", ok: okMessage });
      router.refresh();
      return true;
    } catch (e) {
      setState({ busy: false, error: e.message, ok: "" });
      return false;
    }
  }
  return [state, run];
}

export default function BookingActions({ booking, cars, vendors, requestedCarId }) {
  const [state, run] = useAction(`/api/admin/bookings/${booking.id}`);
  const [carId, setCarId] = useState(booking.assignedCarId || requestedCarId || "");
  const [vendorId, setVendorId] = useState(booking.assignedVendorId || "");
  const [newDate, setNewDate] = useState("");
  const [note, setNote] = useState("");
  const [total, setTotal] = useState(booking.total);
  const [advance, setAdvance] = useState(booking.advanceAmount);
  const [adjLabel, setAdjLabel] = useState("");
  const closed = ["CANCELLED", "COMPLETED"].includes(booking.status);

  return (
    <div className="space-y-6">
      {state.error && <Notice tone="warning">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}

      <section className="border border-line bg-white p-5">
        <h3 className="text-xl">Status & assignment</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className={label}>Assigned car</span>
            <select value={carId} onChange={(e) => setCarId(e.target.value)} className="field min-h-11 py-2 text-sm" disabled={closed}>
              <option value="">— None —</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.make} {c.model}{c.id === requestedCarId ? " (requested)" : ""}</option>)}
            </select>
          </label>
          <label>
            <span className={label}>Assigned vendor / crew</span>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="field min-h-11 py-2 text-sm" disabled={closed}>
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.type.replace("_", " ").toLowerCase()}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {booking.status === "PENDING" && (
            <button type="button" disabled={state.busy} onClick={() => run({ action: "confirm", assignedCarId: carId || null, assignedVendorId: vendorId || null }, "Booking confirmed — the car is now reserved for this date.")} className={`${btn} bg-success text-ivory`}>
              {state.busy && <Loader2 className="size-3.5 animate-spin" />} Confirm booking
            </button>
          )}
          {!closed && (
            <button type="button" disabled={state.busy} onClick={() => run({ action: "update", assignedCarId: carId || null, assignedVendorId: vendorId || null }, "Assignment saved.")} className={`${btn} border border-ink`}>
              Save assignment
            </button>
          )}
          {booking.status === "CONFIRMED" && (
            <button type="button" disabled={state.busy} onClick={() => run({ action: "complete" }, "Marked as completed.")} className={`${btn} bg-ink text-ivory`}>
              Mark completed
            </button>
          )}
          {booking.status !== "CANCELLED" && (
            <button
              type="button"
              disabled={state.busy}
              onClick={() => {
                const reason = window.prompt("Reason for cancellation (shared internally):");
                if (reason !== null) run({ action: "cancel", reason }, "Booking cancelled and car released.");
              }}
              className={`${btn} border border-danger text-danger`}
            >
              Cancel booking
            </button>
          )}
          {booking.customerRequest && (
            <button type="button" disabled={state.busy} onClick={() => run({ action: "update", clearRequest: true, note: "Customer request reviewed." }, "Request marked as handled.")} className={`${btn} border border-line`}>
              Mark request handled
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-stone">Confirming reserves the assigned car for the event date. A car cannot be confirmed for two bookings on the same day.</p>
      </section>

      {!closed && (
        <section className="border border-line bg-white p-5">
          <h3 className="text-xl">Reschedule</h3>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className={label}>New event date</span>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="field min-h-11 py-2 text-sm" />
            </label>
            <button type="button" disabled={state.busy || !newDate} onClick={() => run({ action: "reschedule", newDate }, "Rescheduled — reservation moved and customer notified.")} className={`${btn} bg-ink text-ivory`}>
              Reschedule
            </button>
          </div>
        </section>
      )}

      <section className="border border-line bg-white p-5">
        <h3 className="text-xl">Quote & advance</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label>
            <span className={label}>Final total (₹)</span>
            <input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} className="field min-h-11 py-2 text-sm" />
          </label>
          <label>
            <span className={label}>Advance (₹)</span>
            <input type="number" min={0} value={advance} onChange={(e) => setAdvance(e.target.value)} className="field min-h-11 py-2 text-sm" />
          </label>
          <label>
            <span className={label}>Adjustment label</span>
            <input value={adjLabel} onChange={(e) => setAdjLabel(e.target.value)} placeholder="e.g. Verified route" className="field min-h-11 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={state.busy} onClick={() => run({ action: "update", total: Number(total), advanceAmount: Number(advance), adjustmentLabel: adjLabel }, "Quote updated.")} className={`${btn} border border-ink`}>
            Save quote
          </button>
          <button type="button" disabled={state.busy} onClick={() => run({ action: "update", advanceApproved: !booking.advanceApproved }, booking.advanceApproved ? "Online advance payment withdrawn." : "Customer can now pay the advance online.")} className={`${btn} ${booking.advanceApproved ? "border border-danger text-danger" : "bg-ink text-ivory"}`}>
            {booking.advanceApproved ? "Withdraw payment approval" : "Approve advance payment"}
          </button>
        </div>
      </section>

      <section className="border border-line bg-white p-5">
        <h3 className="text-xl">Internal note</h3>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className="field mt-3 min-h-24 text-sm" placeholder="Visible to staff only" />
        <button type="button" disabled={state.busy || !note.trim()} onClick={async () => (await run({ action: "update", note }, "Note added.")) && setNote("")} className={`${btn} mt-3 border border-ink`}>
          Add note
        </button>
      </section>
    </div>
  );
}

export function PaymentRecorder({ bookingId, payments }) {
  const router = useRouter();
  const [form, setForm] = useState({ amount: "", method: "UPI", reference: "", notes: "" });
  const [refund, setRefund] = useState({ paymentId: "", amount: "", reference: "" });
  const [state, setState] = useState({ busy: false, error: "", ok: "" });
  const refundable = payments.filter((p) => ["CAPTURED", "PARTIALLY_REFUNDED"].includes(p.status));

  async function post(body, ok) {
    setState({ busy: true, error: "", ok: "" });
    const res = await fetch(`/api/admin/bookings/${bookingId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ busy: false, error: data.error || "Failed.", ok: "" });
    setState({ busy: false, error: "", ok });
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-5">
      {state.error && <Notice tone="warning">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await post({ kind: "payment", ...form }, "Payment recorded.")) setForm({ amount: "", method: "UPI", reference: "", notes: "" });
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <p className="text-sm font-semibold sm:col-span-2">Record a verified offline payment</p>
        <input type="number" min={1} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount (₹)" className="field min-h-11 py-2 text-sm" aria-label="Amount" />
        <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="field min-h-11 py-2 text-sm" aria-label="Method">
          {["UPI", "Bank transfer", "Cash", "Cheque", "Card (POS)", "Other"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <input required value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="UTR / receipt reference" className="field min-h-11 py-2 text-sm sm:col-span-2" aria-label="Reference" />
        <button type="submit" disabled={state.busy} className={`${btn} bg-ink text-ivory sm:col-span-2`}>Record payment</button>
      </form>
      {refundable.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            post({ kind: "refund", ...refund }, "Refund recorded.");
          }}
          className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2"
        >
          <p className="text-sm font-semibold sm:col-span-2">Record a refund</p>
          <select required value={refund.paymentId} onChange={(e) => setRefund({ ...refund, paymentId: e.target.value })} className="field min-h-11 py-2 text-sm sm:col-span-2" aria-label="Payment">
            <option value="">Choose payment…</option>
            {refundable.map((p) => <option key={p.id} value={p.id}>₹{p.amount} · {p.method || p.provider} · {p.reference || p.providerPaymentId}</option>)}
          </select>
          <input type="number" min={1} required value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} placeholder="Refund amount (₹)" className="field min-h-11 py-2 text-sm" aria-label="Refund amount" />
          <input value={refund.reference} onChange={(e) => setRefund({ ...refund, reference: e.target.value })} placeholder="Refund reference" className="field min-h-11 py-2 text-sm" aria-label="Refund reference" />
          <button type="submit" disabled={state.busy} className={`${btn} border border-danger text-danger sm:col-span-2`}>Record refund</button>
          <p className="text-xs text-stone sm:col-span-2">Gateway refunds made in the Razorpay dashboard are recorded automatically via webhook.</p>
        </form>
      )}
    </div>
  );
}
