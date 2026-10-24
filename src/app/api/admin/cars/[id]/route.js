import { prisma } from "@/lib/db";
import { handler, json, error, readJson } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { CAR_FIELDS, PRICING_FIELDS } from "@/config/admin-catalog";
import { coerceFields } from "@/lib/admin-fields";
import { audit } from "@/lib/audit";
import { refreshPublicPages } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export const PATCH = handler(async (request, { params }) => {
  const user = await requireAdminApi();
  const { id } = await params;
  const body = await readJson(request);
  const car = coerceFields(CAR_FIELDS, body.car || {}, { partial: true });
  const pricing = coerceFields(PRICING_FIELDS, body.pricing || {}, { partial: true });
  const errors = { ...car.errors, ...Object.fromEntries(Object.entries(pricing.errors).map(([k, v]) => [`pricing.${k}`, v])) };
  if (Object.keys(errors).length) return error("Please check the highlighted fields.", 422, { fields: errors });

  const existing = await prisma.car.findUnique({ where: { id }, include: { pricing: true } });
  if (!existing) return error("Car not found.", 404);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.car.update({ where: { id }, data: { ...car.data, isDemo: false } });
      if (Object.keys(pricing.data).length) {
        if (existing.pricing) await tx.vehiclePricingRule.update({ where: { carId: id }, data: pricing.data });
        else {
          const full = coerceFields(PRICING_FIELDS, body.pricing || {});
          if (Object.keys(full.errors).length) throw Object.assign(new Error("pricing"), { fields: full.errors });
          await tx.vehiclePricingRule.create({ data: { ...full.data, carId: id } });
        }
      }
    });
  } catch (e) {
    if (e?.fields) return error("Please complete the pricing rule.", 422, { fields: e.fields });
    if (e?.code === "P2002") return error("Another car already uses this slug.", 409, { fields: { slug: "Slug already in use." } });
    throw e;
  }
  refreshPublicPages();
  await audit(user.id, "UPDATE", "car", id, { car: car.data, pricing: pricing.data });
  return json({ ok: true });
});
