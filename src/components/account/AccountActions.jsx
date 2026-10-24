"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";

export function LogoutButton({ redirectTo = "/" }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign(redirectTo);
      }}
      className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal hover:text-burgundy"
    >
      <LogOut className="size-4" aria-hidden="true" /> Sign out
    </button>
  );
}

export function ClaimBookingForm() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(e) {
    e.preventDefault();
    setState({ status: "loading", message: "" });
    const res = await fetch("/api/account/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, phone }) });
    const data = await res.json();
    if (!res.ok) return setState({ status: "error", message: data.error });
    setState({ status: "done", message: "Booking added to your account." });
    setReference("");
    setPhone("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Input label="Booking reference" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} required />
      <Input label="Mobile used" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <button type="submit" disabled={state.status === "loading"} className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] hover:bg-ink hover:text-ivory">
        {state.status === "loading" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Add
      </button>
      {state.status === "error" && <Notice tone="warning" className="sm:col-span-3">{state.message}</Notice>}
      {state.status === "done" && <Notice tone="success" className="sm:col-span-3">{state.message}</Notice>}
    </form>
  );
}
