"use client";

import { useId } from "react";

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%2385662f' stroke-width='1.5'/%3E%3C/svg%3E\")";

export function Field({ label, error, hint, required, children, className = "", id: givenId }) {
  const auto = useId();
  const id = givenId || auto;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-charcoal">
          {label}
          {required && (
            <span className="ml-1 text-burgundy" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children({ id, "aria-invalid": error ? "true" : undefined, "aria-describedby": describedBy, required })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ label, error, hint, required, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={props.id}>
      {(a) => <input className="field" {...a} {...props} />}
    </Field>
  );
}

export function Select({ label, error, hint, required, className, children, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={props.id}>
      {(a) => (
        <select
          className="field appearance-none bg-no-repeat pr-10"
          style={{ backgroundImage: CHEVRON, backgroundPosition: "right 1rem center", backgroundSize: "12px 8px" }}
          {...a}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
}

export function Textarea({ label, error, hint, required, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} id={props.id}>
      {(a) => <textarea className="field min-h-28 resize-y" {...a} {...props} />}
    </Field>
  );
}

export function Checkbox({ label, description, error, className = "", ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input id={id} type="checkbox" className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[#151515]" aria-invalid={error ? "true" : undefined} {...props} />
        <span>
          <span className="text-sm text-ink">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-stone">{description}</span>}
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
