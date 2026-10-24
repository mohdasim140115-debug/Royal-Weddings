"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { formatINR } from "@/lib/format";

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load the payment window. Please check your connection."));
    document.body.appendChild(s);
  });
}

/**
 * Opens Razorpay checkout for the approved advance. The payment is only
 * recorded after /api/payments/verify validates the signature server-side.
 */
export default function PayButton({ reference, token, amount, label = "Pay advance securely" }) {
  const router = useRouter();
  const [state, setState] = useState({ status: "idle", message: "" });

  async function pay() {
    setState({ status: "loading", message: "" });
    try {
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, token }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not start the payment.");
      await loadCheckout();

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount * 100,
        currency: "INR",
        name: order.businessName,
        description: `Advance for booking ${reference}`,
        prefill: order.prefill,
        theme: { color: "#151515" },
        handler: async (resp) => {
          setState({ status: "verifying", message: "" });
          const v = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, reference, token }),
          });
          const data = await v.json();
          if (!v.ok) {
            setState({ status: "error", message: data.error || "We could not verify the payment. If money was debited, it will be reconciled automatically — please contact us." });
            return;
          }
          setState({ status: "done", message: "Payment verified. Thank you!" });
          router.refresh();
        },
        modal: { ondismiss: () => setState((s) => (s.status === "loading" ? { status: "idle", message: "" } : s)) },
      });
      rzp.on("payment.failed", (r) => setState({ status: "error", message: r?.error?.description || "The payment was not completed. No amount has been recorded." }));
      rzp.open();
    } catch (e) {
      setState({ status: "error", message: e.message });
    }
  }

  const busy = state.status === "loading" || state.status === "verifying";
  return (
    <div>
      <button type="button" onClick={pay} disabled={busy || state.status === "done"} className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-charcoal disabled:opacity-60 sm:w-auto">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
        {state.status === "verifying" ? "Verifying payment…" : `${label} · ${formatINR(amount)}`}
      </button>
      <div aria-live="polite" className="mt-2 text-sm">
        {state.status === "error" && <p className="text-danger">{state.message}</p>}
        {state.status === "done" && <p className="text-success">{state.message}</p>}
      </div>
    </div>
  );
}
