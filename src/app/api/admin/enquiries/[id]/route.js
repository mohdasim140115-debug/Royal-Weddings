import { prisma } from "@/lib/db";
import { handler, json, error, readJson } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const PATCH = handler(async (request, { params }) => {
  await requireAdminApi();
  const { id } = await params;
  const { status } = await readJson(request);
  if (!["NEW", "CONTACTED", "CLOSED"].includes(status)) return error("Invalid status.", 422);
  const updated = await prisma.enquiry.updateMany({ where: { id }, data: { status } });
  if (!updated.count) return error("Enquiry not found.", 404);
  return json({ ok: true });
});
