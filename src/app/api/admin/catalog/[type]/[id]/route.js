import { prisma } from "@/lib/db";
import { handler, json, error, readJson } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { CATALOGS } from "@/config/admin-catalog";
import { coerceFields } from "@/lib/admin-fields";
import { audit } from "@/lib/audit";
import { refreshPublicPages } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export const PATCH = handler(async (request, { params }) => {
  const user = await requireAdminApi();
  const { type, id } = await params;
  const cfg = CATALOGS[type];
  if (!cfg) return error("Unknown catalogue.", 404);
  const { data, errors } = coerceFields(cfg.fields, await readJson(request), { partial: true });
  if (Object.keys(errors).length) return error("Please check the highlighted fields.", 422, { fields: errors });
  // Once an admin edits a seeded record it is real business data.
  if (cfg.hasDemo) data.isDemo = false;
  try {
    await prisma[cfg.model].update({ where: { id }, data });
  } catch (e) {
    if (e?.code === "P2025") return error("Item not found.", 404);
    if (e?.code === "P2002") return error("Another item already uses this slug or code.", 409);
    throw e;
  }
  refreshPublicPages();
  await audit(user.id, "UPDATE", cfg.model, id, data);
  return json({ ok: true });
});

export const DELETE = handler(async (request, { params }) => {
  const user = await requireAdminApi({ adminOnly: true });
  const { type, id } = await params;
  const cfg = CATALOGS[type];
  if (!cfg) return error("Unknown catalogue.", 404);
  try {
    await prisma[cfg.model].delete({ where: { id } });
  } catch (e) {
    if (e?.code === "P2003") return error("This item is in use. Deactivate it instead.", 409);
    if (e?.code === "P2025") return error("Item not found.", 404);
    throw e;
  }
  refreshPublicPages();
  await audit(user.id, "DELETE", cfg.model, id);
  return json({ ok: true });
});
