import { slugify } from "./format.js";
import { clean } from "./validation.js";

/**
 * Coerces untrusted input into a Prisma data object using field
 * definitions. Unknown keys are dropped. Returns { data, errors }.
 * With `partial`, missing fields are left untouched (for PATCH).
 */
export function coerceFields(defs, input = {}, { partial = false } = {}) {
  const data = {};
  const errors = {};
  for (const f of defs) {
    const present = Object.prototype.hasOwnProperty.call(input, f.name);
    if (!present && partial) continue;
    let v = input[f.name];

    switch (f.type) {
      case "text":
      case "textarea":
      case "category": {
        v = clean(v, f.type === "textarea" ? 4000 : 300);
        if (f.upper) v = v.toUpperCase().replace(/\s+/g, "");
        if (!v && !f.required) v = f.type === "category" ? undefined : null;
        if (f.required && !v) errors[f.name] = `${f.label} is required.`;
        break;
      }
      case "slug": {
        // An empty slug is generated from other fields (e.g. village + city).
        v = slugify(clean(v, 120) || (f.from ? f.from.map((k) => clean(input[k], 120)).filter(Boolean).join(" ") : ""));
        if (f.required && !v) errors[f.name] = `${f.label} is required.`;
        break;
      }
      case "money":
      case "int": {
        if (v === "" || v == null) {
          if (f.nullable) v = null;
          else if (f.required) {
            errors[f.name] = `${f.label} is required.`;
            v = undefined;
          } else v = f.default ?? 0;
          break;
        }
        const n = Math.round(Number(v));
        if (!Number.isFinite(n) || n < (f.min ?? 0) || n > (f.max ?? 100_000_000)) {
          errors[f.name] = `${f.label} must be a number${f.min != null ? ` from ${f.min}` : " ≥ 0"}${f.max != null ? ` to ${f.max}` : ""}.`;
          v = undefined;
        } else v = n;
        break;
      }
      case "coord": {
        if (v === "" || v == null) {
          v = null;
          break;
        }
        const n = Number(v);
        if (!Number.isFinite(n) || n < f.min || n > f.max) {
          errors[f.name] = `${f.label} must be a number from ${f.min} to ${f.max}.`;
          v = undefined;
        } else v = Math.round(n * 1e6) / 1e6;
        break;
      }
      case "boolean":
        v = present ? v === true || v === "true" || v === "on" || v === 1 : Boolean(f.default);
        break;
      case "select":
        if (!f.options.includes(v)) {
          if (f.required || v) errors[f.name] = `Choose a valid ${f.label.toLowerCase()}.`;
          v = undefined;
        }
        break;
      case "date": {
        if (!v) {
          v = null;
          break;
        }
        const d = new Date(`${String(v).slice(0, 10)}T00:00:00.000Z`);
        if (Number.isNaN(d.getTime())) {
          errors[f.name] = `${f.label} is not a valid date.`;
          v = undefined;
        } else v = d;
        break;
      }
      case "list": {
        const arr = Array.isArray(v) ? v : String(v ?? "").split(/\r?\n/);
        v = arr.map((s) => clean(s, 300)).filter(Boolean).slice(0, 30);
        if (f.required && v.length === 0) errors[f.name] = `${f.label} needs at least one line.`;
        break;
      }
      default:
        v = undefined;
    }
    if (v !== undefined) data[f.name] = v;
  }
  return { data, errors };
}
