"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";

export default function ChangeRequestForm({ reference, token, pending }) {
  const router = useRouter();
  const [type, setType] = useState("RESCHEDULE");
  const [newDate, setNewDate] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  if (pending) {
    return <Notice>Your {pending === "RESCHEDULE" ? "reschedule" : "cancellation"} request has been sent. Our team will contact you shortly.</Notice>;
  }

  async function submit(e) {
    e.preventDefault();
    if (state.status === "sending") return;
    setState({ status: "sending", message: "" });
    try {
      const res = await fetch(`/api/bookings/${reference}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, newDate, message, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send your request.");
      setState({ status: "sent", message: "" });
      router.refresh();
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">Request type</legend>
        {[
          ["RESCHEDULE", "Reschedule"],
          ["CANCELLATION", "Cancel booking"],
        ].map(([v, l]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="reqtype" checked={type === v} onChange={() => setType(v)} className="peer sr-only" />
            <span className="flex min-h-11 items-center justify-center border border-line bg-white text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-champagne-deep">{l}</span>
          </label>
        ))}
      </fieldset>
      {type === "RESCHEDULE" && <Input label="Preferred new date" type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} />}
      <Textarea label="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />
      {type === "CANCELLATION" && <p className="text-xs text-stone">Refunds, if any, follow our cancellation policy. Nothing is cancelled until our team confirms.</p>}
      {state.status === "error" && <Notice tone="warning">{state.message}</Notice>}
      <button type="submit" disabled={state.status === "sending"} className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-6 text-[0.72rem] font-semibold uppercase tracking-[0.16em] hover:bg-ink hover:text-ivory disabled:opacity-60">
        {state.status === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Send request
      </button>
    </form>
  );
}
