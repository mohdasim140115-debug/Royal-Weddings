const tones = {
  neutral: "border-line bg-sand text-charcoal",
  gold: "border-champagne/50 bg-champagne-soft/40 text-champagne-deep",
  dark: "border-ink bg-ink text-ivory",
  burgundy: "border-burgundy/20 bg-burgundy-soft text-burgundy",
  success: "border-success/20 bg-[#e8f0eb] text-success",
  danger: "border-danger/20 bg-[#f7e9e9] text-danger",
};

export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
