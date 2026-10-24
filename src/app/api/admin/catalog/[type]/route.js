import { prisma } from "@/lib/db";
import { handler, json, error, readJson } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { CATALOGS } from "@/config/admin-catalog";
import { coerceFields } from "@/lib/admin-fields";
import { audit } from "@/lib/audit";
import { refreshPublicPages } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export const POST = handler(async (request, { params }) => {
  const user = await requireAdminApi();
  const { type } = await params;
  const cfg = CATALOGS[type];
  if (!cfg) return error("Unknown catalogue.", 404);
  const { data, errors } = coerceFields(cfg.fields, await readJson(request));
  if (Object.keys(errors).length) return error("Please check the highlighted fields.", 422, { fields: errors });
  try {
    const row = await prisma[cfg.model].create({ data });
    refreshPublicPages();
    await audit(user.id, "CREATE", cfg.model, row.id, data);
    return json({ ok: true, id: row.id }, 201);
  } catch (e) {
    if (e?.code === "P2002") return error("An item with this slug or code already exists.", 409);
    throw e;
  }
});
