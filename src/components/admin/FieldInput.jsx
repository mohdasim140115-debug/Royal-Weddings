"use client";

/** Renders one admin field definition (see src/config/admin-catalog.js). */
export default function FieldInput({ field, value, onChange, error, categories = [] }) {
  const id = `f-${field.name}`;
  const common = { id, name: field.name, "aria-invalid": error ? "true" : undefined, "aria-describedby": error ? `${id}-err` : field.help ? `${id}-help` : undefined };
  let control;

  switch (field.type) {
    case "textarea":
      control = <textarea {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field min-h-24 text-sm" />;
      break;
    case "list":
      control = <textarea {...common} value={Array.isArray(value) ? value.join("\n") : value ?? ""} onChange={(e) => onChange(e.target.value)} className="field min-h-24 text-sm" />;
      break;
    case "boolean":
      return (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" {...common} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#151515]" />
          {field.label}
        </label>
      );
    case "select":
      control = (
        <select {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field min-h-11 py-2 text-sm">
          {!field.required && <option value="">—</option>}
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case "category":
      control = (
        <select {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field min-h-11 py-2 text-sm">
          <option value="">Choose…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      );
      break;
    case "money":
    case "int":
      control = <input type="number" {...common} min={field.min ?? 0} max={field.max} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field min-h-11 py-2 text-sm" />;
      break;
    case "coord":
      control = <input type="number" step="any" {...common} min={field.min} max={field.max} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field min-h-11 py-2 text-sm" />;
      break;
    case "date":
      control = <input type="date" {...common} value={value ? String(value).slice(0, 10) : ""} onChange={(e) => onChange(e.target.value)} className="field min-h-11 py-2 text-sm" />;
      break;
    default:
      control = <input {...common} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field min-h-11 py-2 text-sm" />;
  }

  return (
    <div className={field.type === "textarea" || field.type === "list" ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-charcoal">
        {field.label}
        {field.required && <span className="text-burgundy"> *</span>}
      </label>
      {control}
      {field.help && !error && <p id={`${id}-help`} className="mt-1 text-xs text-stone">{field.help}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function initialValues(fields, row = {}) {
  return Object.fromEntries(fields.map((f) => [f.name, row[f.name] ?? (f.type === "boolean" ? Boolean(f.default) : f.default ?? (f.type === "list" ? [] : ""))]));
}
