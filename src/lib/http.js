import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "./rate-limit.js";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function readJson(request, maxBytes = 64_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError("Request too large.", 413);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError("Invalid JSON body.", 400);
  }
}

export class HttpError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function limitOrThrow(request, name, opts) {
  const r = rateLimit(`${name}:${clientIp(request)}`, opts);
  if (!r.ok) throw new HttpError("Too many requests. Please wait a moment and try again.", 429);
}

/** Wraps a route handler with consistent error handling. */
export function handler(fn) {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx);
    } catch (e) {
      if (e instanceof HttpError) return error(e.message, e.status, e.extra);
      console.error("[api]", e);
      return error("Something went wrong on our side. Please try again.", 500);
    }
  };
}
