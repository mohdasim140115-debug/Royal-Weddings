"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnquiryStatus({ id, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  return (
    <label className="shrink-0">
      <span className="sr-only">Status</span>
      <select
        value={value}
        disabled={busy}
        onChange={async (e) => {
          const next = e.target.value;
          setValue(next);
          setBusy(true);
          const res = await fetch(`/api/admin/enquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
          setBusy(false);
          if (!res.ok) setValue(status);
          router.refresh();
        }}
        className="field min-h-10 w-40 py-1.5 text-sm"
      >
        <option value="NEW">New</option>
        <option value="CONTACTED">Contacted</option>
        <option value="CLOSED">Closed</option>
      </select>
    </label>
  );
}
