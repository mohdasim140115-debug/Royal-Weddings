import { NextResponse } from "next/server";
import { listPublicPlaces } from "@/lib/places";

export const dynamic = "force-dynamic";

/** Public list of villages and cities for the pickup / venue pickers. */
export async function GET() {
  const places = await listPublicPlaces();
  return NextResponse.json({ places }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
