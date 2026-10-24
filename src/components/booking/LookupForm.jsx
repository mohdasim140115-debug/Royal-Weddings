"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";

export default function LookupForm() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(e) {
    e.preventDefault();
    setState({ status: "loading", message: "" });
    try {
      const res = await fetch("/api/bookings/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(data.url);
    } catch (err) {
      setState({ status: "error", message: err.message || "Something went wrong." });
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Input label="Booking reference" required value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} placeholder="RW-26K-XXXXXX" autoCapitalize="characters" />
      <Input label="Mobile number" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      {state.status === "error" && <Notice tone="warning">{state.message}</Notice>}
      <button type="submit" disabled={state.status === "loading"} className="inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory disabled:opacity-60">
        {state.status === "loading" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Find booking
      </button>
    </form>
  );
}
