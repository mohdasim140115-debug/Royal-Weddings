import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";

const tones = {
  info: { cls: "border-champagne/50 bg-champagne-soft/25 text-charcoal", Icon: Info, icon: "text-champagne-deep" },
  warning: { cls: "border-burgundy/25 bg-burgundy-soft text-burgundy", Icon: AlertTriangle, icon: "text-burgundy" },
  success: { cls: "border-success/25 bg-[#e8f0eb] text-success", Icon: CheckCircle2, icon: "text-success" },
};

export default function Notice({ tone = "info", title, children, className = "" }) {
  const t = tones[tone];
  return (
    <div className={`flex gap-3 border p-4 text-sm leading-relaxed ${t.cls} ${className}`} role={tone === "warning" ? "alert" : "note"}>
      <t.Icon className={`mt-0.5 size-4 shrink-0 ${t.icon}`} aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}
