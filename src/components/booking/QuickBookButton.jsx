"use client";

export const QUICK_BOOK_EVENT = "quickbook:open";

/** Opens the "Book Now" modal (rendered by the site header), optionally with a car pre-selected. */
export function openQuickBook(car = "") {
  window.dispatchEvent(new CustomEvent(QUICK_BOOK_EVENT, { detail: { car } }));
}

/**
 * A link to the full booking page that opens the quick-book modal instead.
 * The href stays as a fallback before JavaScript has loaded.
 */
export default function QuickBookButton({ car = "", href, className = "", children, ...props }) {
  return (
    <a
      href={href || (car ? `/booking?service=CAR&car=${car}` : "/booking")}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        openQuickBook(car);
      }}
      aria-haspopup="dialog"
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}
