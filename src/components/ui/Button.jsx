import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.16em] transition-all duration-300 ease-[var(--ease-luxe)] disabled:pointer-events-none disabled:opacity-50 min-h-12 px-6 py-3 rounded-[2px] text-center leading-snug";

const variants = {
  primary: "bg-ink text-ivory hover:bg-charcoal",
  gold: "bg-champagne text-ink hover:bg-[#b8955c]",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-ivory",
  "outline-light": "border border-ivory/60 text-ivory hover:bg-ivory hover:text-ink",
  ghost: "text-ink hover:text-champagne-deep px-0 min-h-0",
  burgundy: "bg-burgundy text-ivory hover:bg-[#561a2a]",
};

const sizes = { sm: "min-h-10 px-4 text-[0.72rem]", md: "", lg: "min-h-14 px-8" };

export function buttonClass(variant = "primary", size = "md", extra = "") {
  return [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");
}

export default function Button({ href, variant = "primary", size = "md", className = "", children, ...props }) {
  const cls = buttonClass(variant, size, className);
  if (href) {
    if (/^https?:/.test(href)) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} type="button" {...props}>
      {children}
    </button>
  );
}
