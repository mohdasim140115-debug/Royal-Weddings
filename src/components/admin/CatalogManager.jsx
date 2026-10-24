"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import Notice from "@/components/ui/Notice";
import FieldInput, { initialValues } from "./FieldInput";
import { CATALOGS } from "@/config/admin-catalog";

function display(v) {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

export default function CatalogManager({ type, rows, canDelete }) {
  const cfg = CATALOGS[type];
  const router = useRouter();
  const [editing, setEditing] = useState(null); // null | "new" | row
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy: false, error: "", ok: "" });

  function open(row) {
    setEditing(row || "new");
    setValues(initialValues(cfg.fields, row || {}));
    setErrors({});
    setState({ busy: false, error: "", ok: "" });
  }

  async function save(e) {
    e.preventDefault();
    setState({ busy: true, error: "", ok: "" });
    const isNew = editing === "new";
    const res = await fetch(isNew ? `/api/admin/catalog/${type}` : `/api/admin/catalog/${type}/${editing.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(data.fields || {});
      setState({ busy: false, error: data.error || "Could not save.", ok: "" });
      return;
    }
    setEditing(null);
    setState({ busy: false, error: "", ok: isNew ? "Created." : "Saved." });
    router.refresh();
  }

  async function remove(row) {
    if (!window.confirm("Delete this item permanently? Consider deactivating it instead.")) return;
    const res = await fetch(`/api/admin/catalog/${type}/${row.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setState({ busy: false, error: res.ok ? "" : data.error || "Could not delete.", ok: res.ok ? "Deleted." : "" });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      {cfg.note && <Notice className="mb-4">{cfg.note}</Notice>}
      {state.ok && !editing && <Notice tone="success" className="mb-4">{state.ok}</Notice>}
      {state.error && !editing && <Notice tone="warning" className="mb-4">{state.error}</Notice>}

      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => open(null)} className="inline-flex min-h-10 items-center gap-2 bg-ink px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ivory">
          <Plus className="size-4" aria-hidden="true" /> Add new
        </button>
      </div>

      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[0.65rem] uppercase tracking-[0.14em] text-stone">
              {cfg.columns.map((c) => <th key={c} className="px-3 py-3 font-semibold">{cfg.fields.find((f) => f.name === c)?.label?.replace(/\(.*\)/, "") || c}</th>)}
              {cfg.hasDemo && <th className="px-3 py-3 font-semibold">Data</th>}
              <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                {cfg.columns.map((c) => <td key={c} className="px-3 py-3">{display(r[c])}</td>)}
                {cfg.hasDemo && <td className="px-3 py-3 text-xs">{r.isDemo ? <span className="text-burgundy">Sample</span> : "Live"}</td>}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => open(r)} className="inline-flex size-9 items-center justify-center hover:text-champagne-deep" aria-label={`Edit ${r.name || r.title || r.code || r.city}`}>
                    <Pencil className="size-4" />
                  </button>
                  {canDelete && (
                    <button type="button" onClick={() => remove(r)} className="inline-flex size-9 items-center justify-center hover:text-danger" aria-label={`Delete ${r.name || r.title || r.code || r.city}`}>
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={cfg.columns.length + 2} className="px-3 py-6 text-stone">Nothing here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div role="dialog" aria-modal="true" aria-label={editing === "new" ? "Add item" : "Edit item"} className="fixed inset-0 z-50 flex justify-end bg-ink/40">
          <form onSubmit={save} className="flex h-full w-full max-w-2xl flex-col bg-ivory">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-2xl">{editing === "new" ? `New ${cfg.title.toLowerCase()}` : "Edit"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex size-10 items-center justify-center" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 sm:grid-cols-2">
              {state.error && <Notice tone="warning" className="sm:col-span-2">{state.error}</Notice>}
              {cfg.fields.map((f) => (
                <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <button type="button" onClick={() => setEditing(null)} className="min-h-11 px-4 text-xs uppercase tracking-[0.14em]">Cancel</button>
              <button type="submit" disabled={state.busy} className="inline-flex min-h-11 items-center gap-2 bg-ink px-5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ivory disabled:opacity-60">
                {state.busy && <Loader2 className="size-4 animate-spin" />} Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
