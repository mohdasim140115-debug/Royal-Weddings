import { prisma } from "@/lib/db";
import { handler, json, error, readJson } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { CAR_FIELDS, PRICING_FIELDS } from "@/config/admin-catalog";
import { coerceFields } from "@/lib/admin-fields";
import { audit } from "@/lib/audit";
import { refreshPublicPages } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  const user = await requireAdminApi();
  const body = await readJson(request);
  const car = coerceFields(CAR_FIELDS, body.car || {});
  const pricing = coerceFields(PRICING_FIELDS, body.pricing || {});
  const errors = { ...car.errors, ...Object.fromEntries(Object.entries(pricing.errors).map(([k, v]) => [`pricing.${k}`, v])) };
  if (Object.keys(errors).length) return error("Please check the highlighted fields.", 422, { fields: errors });
  try {
    const row = await prisma.car.create({ data: { ...car.data, pricing: { create: pricing.data } } });
    refreshPublicPages();
    await audit(user.id, "CREATE", "car", row.id, { car: car.data, pricing: pricing.data });
    return json({ ok: true, id: row.id }, 201);
  } catch (e) {
    if (e?.code === "P2002") return error("A car with this slug already exists.", 409, { fields: { slug: "Slug already in use." } });
    if (e?.code === "P2003") return error("Choose a valid category.", 422, { fields: { categoryId: "Invalid category." } });
    throw e;
  }
});
