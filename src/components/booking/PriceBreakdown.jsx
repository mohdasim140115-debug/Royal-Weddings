import { formatINR } from "@/lib/format";
import { PRICE_DISCLAIMER } from "@/config/site";

/** Itemised breakdown. Works with a live quote or a stored booking breakdown. */
export default function PriceBreakdown({ quote, showDisclaimer = true, compact = false }) {
  if (!quote) return null;
  const sections = quote.sections || [];
  const text = compact ? "text-[0.8rem]" : "text-sm";

  return (
    <div className={text}>
      {sections.map((s) => (
        <div key={s.title} className="border-b border-line py-3 first:pt-0">
          <p className="font-semibold text-ink">{s.title}</p>
          {s.quoteOnly ? (
            <p className="mt-1 flex justify-between text-stone">
              <span>Bespoke package</span>
              <span>Price on request</span>
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1.5">
              {s.lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-4">
                  <span className="text-charcoal">
                    {l.label}
                    {l.detail && <span className="block text-xs text-stone">{l.detail}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatINR(l.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <dl className="space-y-1.5 pt-3">
        <div className="flex justify-between">
          <dt className="text-charcoal">Subtotal</dt>
          <dd className="tabular-nums">{formatINR(quote.subtotal)}</dd>
        </div>
        {(quote.discounts || []).map((d) => (
          <div key={d.key} className="flex justify-between text-success">
            <dt>{d.label}</dt>
            <dd className="tabular-nums">− {formatINR(d.amount)}</dd>
          </div>
        ))}
        {quote.taxRatePercent > 0 && (
          <div className="flex justify-between">
            <dt className="text-charcoal">
              {quote.taxLabel} ({quote.taxRatePercent}%)
            </dt>
            <dd className="tabular-nums">{formatINR(quote.tax)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-ink pt-3">
          <dt className="font-semibold uppercase tracking-[0.12em] text-[0.7rem]">Estimated total</dt>
          <dd className="font-display text-3xl tabular-nums">{formatINR(quote.total)}</dd>
        </div>
        {quote.advance > 0 && (
          <div className="flex justify-between text-xs text-stone">
            <dt>Advance to reserve (once approved)</dt>
            <dd className="tabular-nums">{formatINR(quote.advance)}</dd>
          </div>
        )}
      </dl>

      {(quote.quoteOnlyItems?.length > 0 || quote.atActuals?.length > 0 || quote.notes?.length > 0) && (
        <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-stone">
          {quote.quoteOnlyItems?.length > 0 && <li>Not yet included: {quote.quoteOnlyItems.join(", ")} (quoted separately).</li>}
          {quote.atActuals?.map((a) => (
            <li key={a.label}>
              <span className="font-medium text-charcoal">{a.label}:</span> {a.note}
            </li>
          ))}
          {quote.notes?.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {showDisclaimer && <p className="mt-4 text-[0.7rem] leading-relaxed text-stone">{PRICE_DISCLAIMER}</p>}
    </div>
  );
}
