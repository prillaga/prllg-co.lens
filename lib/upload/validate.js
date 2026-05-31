const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const MAX_BYTES = 5 * 1024 * 1024;

export function validateUploadFile(file) {
  if (!file) return { ok: false, error: "No file provided." };
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }
  const type = String(file.type || "").toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return { ok: false, error: "Only JPEG, PNG, WebP, or GIF images are allowed." };
  }
  return { ok: true };
}

export function safeFileName(name) {
  return String(name || "upload.jpg")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "upload.jpg";
}
