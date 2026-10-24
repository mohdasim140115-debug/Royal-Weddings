export default function SectionHeading({ eyebrow, title, intro, align = "left", tone = "light", as: Tag = "h2", className = "" }) {
  const dark = tone === "dark";
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && (
        <p className={`eyebrow flex items-center gap-3 ${align === "center" ? "justify-center" : ""} ${dark ? "text-champagne" : "text-champagne-deep"}`}>
          <span className="rule-gold" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <Tag className={`mt-3 text-[2rem] leading-[1.08] text-balance sm:text-[2.5rem] lg:text-[2.75rem] ${dark ? "text-ivory" : "text-ink"}`}>{title}</Tag>
      {intro && <p className={`mt-4 max-w-xl text-[0.95rem] leading-relaxed text-pretty ${dark ? "text-ivory/65" : "text-stone"}`}>{intro}</p>}
    </div>
  );
}
