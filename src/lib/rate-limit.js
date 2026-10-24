// Small in-memory fixed-window rate limiter. Good enough for a single
// server instance; use Redis/Upstash for multi-instance deployments.
const buckets = new Map();

export function rateLimit(key, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    }
    return { ok: true, remaining: limit - 1 };
  }
  b.count += 1;
  return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count), retryAfter: Math.ceil((b.reset - now) / 1000) };
}

/**
 * Best-effort client IP. Prefers X-Real-IP (set by Vercel / nginx), then the
 * right-most X-Forwarded-For entry — the one appended by your own proxy —
 * because left-most entries are client-controlled and trivially spoofed.
 * In production, run behind a reverse proxy that sets X-Real-IP.
 */
export function clientIp(request) {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").pop().trim();
  return "local";
}
