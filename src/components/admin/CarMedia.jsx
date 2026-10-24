"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload, Loader2 } from "lucide-react";
import Notice from "@/components/ui/Notice";
import { formatDate } from "@/lib/format";

export function ImageManager({ carId, images }) {
  const router = useRouter();
  const [state, setState] = useState({ busy: false, error: "" });

  async function upload(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ busy: true, error: "" });
    const res = await fetch(`/api/admin/cars/${carId}/images`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setState({ busy: false, error: res.ok ? "" : data.error || "Upload failed." });
    if (res.ok) {
      e.target.reset();
      router.refresh();
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this image?")) return;
    const res = await fetch(`/api/admin/cars/${carId}/images?imageId=${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="relative aspect-[4/3] overflow-hidden border border-line bg-sand">
              <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 bg-ivory px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]">Cover</span>}
              <button type="button" onClick={() => remove(img.id)} className="absolute right-2 top-2 inline-flex size-8 items-center justify-center bg-ivory/90 hover:text-danger" aria-label="Remove image">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone">No photographs yet — the site shows an elegant placeholder.</p>
      )}
      <form onSubmit={upload} className="mt-4 grid gap-3">
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="text-sm file:mr-3 file:border file:border-ink file:bg-white file:px-3 file:py-2 file:text-xs file:uppercase" aria-label="Image file" />
        <input name="alt" placeholder="Describe the photo (alt text)" className="field min-h-11 py-2 text-sm" aria-label="Alt text" />
        {state.error && <Notice tone="warning">{state.error}</Notice>}
        <button type="submit" disabled={state.busy} className="inline-flex min-h-10 items-center justify-center gap-2 border border-ink px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] hover:bg-ink hover:text-ivory">
          {state.busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload image
        </button>
        <p className="text-xs text-stone">JPEG, PNG or WebP up to 5 MB. Use photographs of the actual vehicle.</p>
      </form>
    </div>
  );
}

export function AvailabilityManager({ carId, blocks }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState({ busy: false, error: "" });

  async function act(action, d = date) {
    setState({ busy: true, error: "" });
    const res = await fetch(`/api/admin/cars/${carId}/availability`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, date: d, note }) });
    const data = await res.json().catch(() => ({}));
    setState({ busy: false, error: res.ok ? "" : data.error || "Failed." });
    if (res.ok) {
      setNote("");
      router.refresh();
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field min-h-11 py-2 text-sm" aria-label="Date" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (e.g. service)" className="field min-h-11 py-2 text-sm" aria-label="Reason" />
        <button type="button" disabled={!date || state.busy} onClick={() => act("block")} className="inline-flex min-h-11 items-center justify-center bg-ink px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">
          Block date
        </button>
      </div>
      {state.error && <Notice tone="warning" className="mt-3">{state.error}</Notice>}
      <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
        {blocks.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
            <span>
              {formatDate(b.date)} · <span className={b.status === "BOOKED" ? "text-success" : "text-burgundy"}>{b.status === "BOOKED" ? "Booked" : "Blocked"}</span>
              {b.note && <span className="text-stone"> — {b.note}</span>}
              {b.reference && <span className="text-stone"> — {b.reference}</span>}
            </span>
            {b.status === "BLOCKED" && (
              <button type="button" onClick={() => act("unblock", b.date.slice(0, 10))} className="text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
                Unblock
              </button>
            )}
          </li>
        ))}
        {blocks.length === 0 && <li className="py-2.5 text-stone">No upcoming reservations or blocks.</li>}
      </ul>
    </div>
  );
}
