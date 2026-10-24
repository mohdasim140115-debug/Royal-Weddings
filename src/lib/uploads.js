import path from "node:path";

// Uploaded files live outside /public because Next.js only serves files that
// exist in /public at build time. They are streamed by /api/uploads/[...path].
// On serverless hosts, replace this with object storage (S3, R2, etc.).
export const UPLOAD_ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
