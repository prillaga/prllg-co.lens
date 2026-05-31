import { getSupabaseAdminClient } from "../storage/supabase-kv.js";
import { safeFileName } from "./validate.js";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export async function uploadProductImage(buffer, fileName, contentType, unitId) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const err = new Error("Storage not configured.");
    err.code = "STORAGE_NOT_CONFIGURED";
    throw err;
  }

  const folder = unitId ? "units/" + unitId : "library";
  const path = folder + "/" + Date.now() + "-" + safeFileName(fileName);

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: contentType,
      upsert: false,
      cacheControl: "3600"
    });

  if (error) {
    if (/bucket/i.test(error.message || "")) {
      const setup = new Error(
        "Photo bucket missing. Run supabase/storage.sql in your Supabase SQL editor."
      );
      setup.code = "STORAGE_BUCKET_MISSING";
      throw setup;
    }
    throw error;
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return {
    url: data.publicUrl,
    path: path
  };
}

export async function deleteProductImageByUrl(url) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !url) return false;

  const marker = "/storage/v1/object/public/" + PRODUCT_IMAGES_BUCKET + "/";
  const idx = String(url).indexOf(marker);
  if (idx === -1) return false;

  const path = decodeURIComponent(String(url).slice(idx + marker.length));
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
  return true;
}
