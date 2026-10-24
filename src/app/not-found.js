import Link from "next/link";
import Logo from "@/components/layout/Logo";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-4 text-center">
      <Link href="/" aria-label="Home"><Logo /></Link>
      <p className="eyebrow mt-14 text-champagne-deep">404</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">This page took a different route</h1>
      <p className="mt-4 max-w-md text-stone">The page you were looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="inline-flex min-h-12 items-center justify-center bg-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory">Back to home</Link>
        <Link href="/cars" className="inline-flex min-h-12 items-center justify-center border border-ink px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em]">Browse cars</Link>
      </div>
    </div>
  );
}
