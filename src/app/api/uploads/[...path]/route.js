import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_ROOT } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(request, { params }) {
  const { path: parts } = await params;
  const target = path.resolve(/*turbopackIgnore: true*/ UPLOAD_ROOT, ...parts);
  // Block path traversal outside the upload root.
  if (!target.startsWith(UPLOAD_ROOT + path.sep)) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(target);
    return new Response(buf, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
