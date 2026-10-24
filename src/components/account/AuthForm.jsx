"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";

/** Sign-in / registration form. `scope="admin"` restricts sign-in to staff. */
export default function AuthForm({ mode = "login", scope = "customer", next = "/account" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: "idle", message: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const register = mode === "register";

  async function submit(e) {
    e.preventDefault();
    if (state.status === "loading") return;
    setState({ status: "loading", message: "" });
    setErrors({});
    try {
      const res = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scope }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || "Something went wrong.");
      }
      // Only allow same-site relative redirects.
      const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      window.location.assign(target);
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      {register && <Input label="Full name" required value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />}
      <Input label="Email" type="email" required value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
      {register && <Input label="Mobile number" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />}
      <Input
        label="Password"
        type="password"
        required
        value={form.password}
        onChange={set("password")}
        error={errors.password}
        autoComplete={register ? "new-password" : "current-password"}
        hint={register ? "At least 10 characters." : undefined}
      />
      {state.status === "error" && <Notice tone="warning">{state.message}</Notice>}
      <button type="submit" disabled={state.status === "loading"} className="inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory hover:bg-charcoal disabled:opacity-60">
        {state.status === "loading" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {register ? "Create account" : "Sign in"}
      </button>
      {scope === "customer" && (
        <p className="text-sm text-stone">
          {register ? "Already have an account? " : "New here? "}
          <Link href={`${register ? "/account/login" : "/account/register"}?next=${encodeURIComponent(next)}`} className="text-ink underline decoration-champagne underline-offset-4">
            {register ? "Sign in" : "Create an account"}
          </Link>
          {!register && (
            <>
              {" "}· or{" "}
              <Link href="/bookings/lookup" className="text-ink underline decoration-champagne underline-offset-4">track a booking as a guest</Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}
