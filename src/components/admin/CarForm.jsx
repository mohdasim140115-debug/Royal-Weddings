"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Notice from "@/components/ui/Notice";
import FieldInput, { initialValues } from "./FieldInput";
import { CAR_FIELDS, PRICING_FIELDS } from "@/config/admin-catalog";

const PRICING_DEFAULTS = { pricingMode: "PACKAGE", includedKm: 80, includedHours: 8, nightStartHour: 22, nightEndHour: 6, tollPolicy: "Toll charges are billed at actuals.", parkingPolicy: "Venue and city parking are billed at actuals." };

export default function CarForm({ car, pricing, categories }) {
  const router = useRouter();
  const isNew = !car;
  const [values, setValues] = useState(() => initialValues(CAR_FIELDS, car || {}));
  const [rates, setRates] = useState(() => initialValues(PRICING_FIELDS, pricing || PRICING_DEFAULTS));
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy: false, error: "", ok: "" });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, error: "", ok: "" });
    const res = await fetch(isNew ? "/api/admin/cars" : `/api/admin/cars/${car.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ car: values, pricing: rates }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(data.fields || {});
      setState({ busy: false, error: data.error || "Could not save.", ok: "" });
      return;
    }
    setErrors({});
    if (isNew) router.push(`/admin/cars/${data.id}`);
    else {
      setState({ busy: false, error: "", ok: "Saved. Changes are live on the website." });
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {state.error && <Notice tone="warning">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <section className="border border-line bg-white p-5">
        <h2 className="text-2xl">Vehicle details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CAR_FIELDS.map((f) => (
            <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} categories={categories} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
          ))}
        </div>
      </section>
      <section className="border border-line bg-white p-5">
        <h2 className="text-2xl">Pricing rule</h2>
        <p className="mt-1 text-sm text-stone">
          Formula: base fare (covers included km & hours) + km beyond included × rate + hours beyond included × rate, topped up to the minimum fare; plus allowance, night, outstation, decoration and tax.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRICING_FIELDS.map((f) => (
            <FieldInput key={f.name} field={f} value={rates[f.name]} error={errors[`pricing.${f.name}`]} onChange={(v) => setRates((s) => ({ ...s, [f.name]: v }))} />
          ))}
        </div>
      </section>
      <div className="flex justify-end">
        <button type="submit" disabled={state.busy} className="inline-flex min-h-12 items-center gap-2 bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory disabled:opacity-60">
          {state.busy && <Loader2 className="size-4 animate-spin" />} {isNew ? "Create car" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
