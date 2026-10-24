"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import Notice from "@/components/ui/Notice";
import { isEmail, isPhone } from "@/lib/validation";

/** Generic enquiry form posting to /api/enquiries. */
export default function EnquiryForm({ source = "contact", carSlug, defaultSubject = "", subjectField = true, compact = false }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: defaultSubject, eventDate: "", message: "", website: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: "idle" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name.";
    if (!isPhone(form.phone)) e.phone = "Enter a valid mobile number.";
    if (form.email && !isEmail(form.email)) e.email = "Enter a valid email address.";
    if (subjectField && form.subject.trim().length < 3) e.subject = "Please add a short subject.";
    if (form.message.trim().length < 10) e.message = "Please tell us a little more (at least 10 characters).";
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (status.state === "sending") return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source, carSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || "We couldn't send your enquiry.");
      }
      setStatus({ state: "sent" });
    } catch (err) {
      setStatus({ state: "error", message: err.message });
    }
  }

  if (status.state === "sent") {
    return (
      <Notice tone="success" title="Thank you — your enquiry has been received.">
        We will get back to you shortly using the details you provided.
      </Notice>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
        <Input label="Your name" required value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
        <Input label="Mobile number" required type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" placeholder="+91" />
        <Input label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <Input label="Event date" type="date" value={form.eventDate} onChange={set("eventDate")} />
      </div>
      {subjectField && <Input label="Subject" required value={form.subject} onChange={set("subject")} error={errors.subject} />}
      <Textarea label="Message" required value={form.message} onChange={set("message")} error={errors.message} placeholder="Venue, timings, number of guests or anything else we should know." />
      {/* Honeypot — hidden from people, tempting to bots */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
      </div>
      {status.state === "error" && <Notice tone="warning">{status.message}</Notice>}
      <button type="submit" disabled={status.state === "sending"} className="inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-charcoal disabled:opacity-60">
        {status.state === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {status.state === "sending" ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-xs text-stone">We use your details only to respond to this enquiry. See our privacy policy.</p>
    </form>
  );
}
