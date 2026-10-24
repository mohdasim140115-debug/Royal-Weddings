import { handler, json, error, readJson, limitOrThrow } from "@/lib/http";
import { buildQuote, normaliseQuoteInput, QuoteError } from "@/lib/quote-service";

export const dynamic = "force-dynamic";

// Live estimate. Prices are always computed here from database rates and
// a server-side route lookup — the client never supplies amounts.
export const POST = handler(async (request) => {
  limitOrThrow(request, "quote", { limit: 40 });
  const input = normaliseQuoteInput(await readJson(request));
  try {
    const result = await buildQuote(input);
    return json({
      quote: result.quote,
      route: result.route,
      routeError: result.routeError,
      distanceSource: result.distanceSource,
      quoteRequired: result.quoteRequired,
      mapsLive: result.mapsLive,
      couponError: result.couponError,
      car: result.car,
    });
  } catch (e) {
    if (e instanceof QuoteError) return error(e.message, 422, { code: e.code, field: e.field });
    throw e;
  }
});
