import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Next.js aliases "server-only" at build time; outside Next it is a no-op.
registerHooks({
  resolve: (specifier, context, next) => (specifier === "server-only" ? { url: "data:text/javascript,", shortCircuit: true } : next(specifier, context)),
});

process.env.GOOGLE_MAPS_API_KEY = "test-key";
const { nearestGarageLegs } = await import("../src/lib/maps.js");

const bases = [
  { name: "Nuh", waypoint: { address: "Nuh, Nuh, Haryana, India" } },
  { name: "Punhana", waypoint: { address: "Punhana, Nuh, Haryana, India" } },
];

function mockMatrix(cells) {
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /computeRouteMatrix/);
    const body = JSON.parse(init.body);
    assert.equal(body.origins.length, 2);
    assert.equal(body.destinations.length, 2);
    return new Response(JSON.stringify(cells), { status: 200 });
  };
}

test("picks the garage with the shortest garage→start + end→garage distance", async () => {
  mockMatrix([
    { originIndex: 0, destinationIndex: 0, distanceMeters: 30000, duration: "2400s", condition: "ROUTE_EXISTS" },
    { originIndex: 0, destinationIndex: 1, distanceMeters: 40000, duration: "3000s", condition: "ROUTE_EXISTS" },
    { originIndex: 1, destinationIndex: 0, distanceMeters: 8000, duration: "900s", condition: "ROUTE_EXISTS" },
    { originIndex: 1, destinationIndex: 1, distanceMeters: 22000, duration: "1500s", condition: "ROUTE_EXISTS" },
  ]);
  const g = await nearestGarageLegs(bases, "Village A", "Village B");
  assert.deepEqual(g, { base: "Punhana", toStartKm: 8, fromEndKm: 22, km: 30, minutes: 40 });
});

test("ignores garages without a road route", async () => {
  mockMatrix([
    { originIndex: 0, destinationIndex: 0, distanceMeters: 50000, duration: "3600s", condition: "ROUTE_EXISTS" },
    { originIndex: 0, destinationIndex: 1, distanceMeters: 50000, duration: "3600s", condition: "ROUTE_EXISTS" },
    { originIndex: 1, destinationIndex: 0, condition: "ROUTE_NOT_FOUND" },
    { originIndex: 1, destinationIndex: 1, distanceMeters: 1000, duration: "60s", condition: "ROUTE_EXISTS" },
  ]);
  const g = await nearestGarageLegs(bases, "Village C", "Village D");
  assert.equal(g.base, "Nuh");
  assert.equal(g.km, 100);
});

test("returns null when no garages are configured", async () => {
  assert.equal(await nearestGarageLegs([], "X", "Y"), null);
});
