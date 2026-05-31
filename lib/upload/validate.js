const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validateUploadFile(file) {
  if (!file || !file.size) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }
  const type = String(file.type || "").toLowerCase();
  if (!ALLOWED.has(type)) {
    return { ok: false, error: "Use JPEG, PNG, WebP, or GIF only." };
  }
  return { ok: true };
}

export function safeFileName(name) {
  return String(name || "upload.jpg")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "upload.jpg";
}
