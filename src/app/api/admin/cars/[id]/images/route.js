import crypto from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { handler, json, error } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { clean } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { refreshPublicPages } from "@/lib/revalidate";
import { UPLOAD_ROOT } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

// Identify the format from the file's magic bytes, not its name or MIME header.
function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

export const POST = handler(async (request, { params }) => {
  const user = await requireAdminApi();
  const { id } = await params;
  const car = await prisma.car.findUnique({ where: { id }, select: { id: true, make: true, model: true, _count: { select: { images: true } } } });
  if (!car) return error("Car not found.", 404);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return error("Choose an image to upload.", 422);
  if (file.size > MAX_BYTES) return error("Images must be 5 MB or smaller.", 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return error("Only JPEG, PNG or WebP images are allowed.", 415);

  const name = `${crypto.randomBytes(10).toString("hex")}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, "cars", car.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);

  const image = await prisma.carImage.create({
    data: {
      carId: car.id,
      url: `/api/uploads/cars/${car.id}/${name}`,
      alt: clean(form.get("alt"), 200) || `${car.make} ${car.model}`,
      sortOrder: car._count.images,
    },
  });
  refreshPublicPages();
  await audit(user.id, "UPLOAD_IMAGE", "car", car.id, { imageId: image.id });
  return json({ ok: true, image }, 201);
});

export const DELETE = handler(async (request, { params }) => {
  const user = await requireAdminApi();
  const { id } = await params;
  const imageId = new URL(request.url).searchParams.get("imageId");
  const image = await prisma.carImage.findFirst({ where: { id: imageId || "", carId: id } });
  if (!image) return error("Image not found.", 404);
  await prisma.carImage.delete({ where: { id: image.id } });
  if (image.url.startsWith("/api/uploads/")) {
    const target = path.resolve(UPLOAD_ROOT, image.url.replace("/api/uploads/", ""));
    if (target.startsWith(UPLOAD_ROOT + path.sep)) await unlink(target).catch(() => {});
  }
  refreshPublicPages();
  await audit(user.id, "DELETE_IMAGE", "car", id, { imageId: image.id });
  return json({ ok: true });
});
