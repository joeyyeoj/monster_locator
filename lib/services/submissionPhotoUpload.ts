import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") {
    return "jpg";
  }
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  return "bin";
}

export function assertValidSubmissionPhoto(file: File): void {
  if (file.size === 0) {
    throw new Error("EMPTY_FILE");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("INVALID_FILE_TYPE");
  }
}

export async function uploadSubmissionPhotoToBlob(file: File): Promise<string> {
  assertValidSubmissionPhoto(file);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("MISSING_BLOB_TOKEN");
  }

  const ext = extensionForMime(file.type);
  const pathname = `submissions/${Date.now()}-${randomUUID()}.${ext}`;
  const blob = await put(pathname, file, { access: "public", token });
  return blob.url;
}
