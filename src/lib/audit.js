import "server-only";
import { prisma } from "./db.js";

export async function audit(actorId, action, entity, entityId, data) {
  try {
    await prisma.auditLog.create({ data: { actorId: actorId || null, action, entity, entityId: entityId || null, data: data ?? undefined } });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
