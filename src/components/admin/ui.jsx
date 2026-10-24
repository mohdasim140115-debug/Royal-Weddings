import Link from "next/link";

export function AdminHeader({ title, intro, actions }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-4xl">{title}</h1>
        {intro && <p className="mt-1 text-sm text-stone">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, href }) {
  const body = (
    <>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-stone">{label}</p>
      <p className="mt-2 font-display text-4xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block border border-line bg-white p-5 transition-colors hover:border-ink">{body}</Link>
  ) : (
    <div className="border border-line bg-white p-5">{body}</div>
  );
}

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`border border-line bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          {title && <h2 className="text-2xl">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[0.65rem] uppercase tracking-[0.14em] text-stone">
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export const linkBtn = "inline-flex min-h-10 items-center gap-2 border border-ink px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] hover:bg-ink hover:text-ivory";
export const darkBtn = "inline-flex min-h-10 items-center gap-2 bg-ink px-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ivory hover:bg-charcoal";
