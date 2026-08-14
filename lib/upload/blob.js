import { put, del } from "@vercel/blob";

export function isBlobConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function uploadImageBuffer(buffer, fileName, contentType) {
  if (!isBlobConfigured()) {
    const err = new Error("Image storage is not configured. Connect Vercel Blob on your project.");
    err.code = "BLOB_NOT_CONFIGURED";
    throw err;
  }

  const blob = await put(fileName, buffer, {
    access: "public",
    contentType: contentType,
    addRandomSuffix: true
  });

  return blob;
}

export async function deleteImageByUrl(url) {
  if (!isBlobConfigured()) {
    const err = new Error("Image storage is not configured.");
    err.code = "BLOB_NOT_CONFIGURED";
    throw err;
  }
  if (!url || !String(url).includes("blob.vercel-storage.com")) {
    return false;
  }
  await del(url);
  return true;
}
