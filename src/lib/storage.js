import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { put, del } from "@vercel/blob";
import { UPLOAD_ROOT } from "./uploads.js";

// Uploaded images go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set
// (Vercel → Storage → Blob, connected to the project); otherwise to the local
// UPLOAD_DIR, which only works on servers with a persistent disk.
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Saves an image and returns the public URL to store in the database. */
export async function saveImage(folder, name, buf, ext) {
  if (blobEnabled()) {
    const blob = await put(`${folder}/${name}`, buf, { access: "public", contentType: TYPES[ext], addRandomSuffix: false });
    return blob.url;
  }
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/api/uploads/${folder}/${name}`;
}

/** Deletes a previously saved image; ignores URLs it does not own. */
export async function deleteImage(url) {
  if (url.startsWith("/api/uploads/")) {
    const target = path.resolve(UPLOAD_ROOT, url.replace("/api/uploads/", ""));
    if (target.startsWith(UPLOAD_ROOT + path.sep)) await unlink(target).catch(() => {});
  } else if (blobEnabled() && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
    await del(url).catch(() => {});
  }
}
