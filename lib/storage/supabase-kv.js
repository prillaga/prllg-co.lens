import { createClient } from "@supabase/supabase-js";
import {
  getStorageDiagnostics,
  getSupabaseKeyForClient,
  getSupabaseUrlForClient,
  isStorageEnvConfigured
} from "./diagnostics.js";

const TABLE = "prillaga_store";

function getSupabaseConfig() {
  if (!isStorageEnvConfigured()) return null;
  return {
    url: getSupabaseUrlForClient(),
    key: getSupabaseKeyForClient()
  };
}

let client = null;

function getClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  if (!client) {
    client = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return client;
}

export function isKvStorageConfigured() {
  return isStorageEnvConfigured();
}

export { getStorageDiagnostics };

export function storageNotConfiguredError(message) {
  const diag = getStorageDiagnostics();
  let text = message || "Site storage is not configured on the server.";
  if (diag.missing.length) {
    text += " Missing on Vercel: " + diag.missing.join(", ") + ".";
  }
  const err = new Error(text);
  err.code = "STORAGE_NOT_CONFIGURED";
  err.diagnostics = diag;
  return err;
}

export async function readJson(key) {
  const supabase = getClient();
  if (!supabase) {
    throw storageNotConfiguredError();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || /prillaga_store/i.test(error.message || "")) {
      throw storageNotConfiguredError(
        "Database table missing. Run supabase/schema.sql in your Supabase SQL editor."
      );
    }
    if (error.code === "42501" || /permission denied/i.test(error.message || "")) {
      throw storageNotConfiguredError(
        "Supabase key lacks permission. Use the secret key (sb_secret_...) or service_role — not the publishable key."
      );
    }
    throw error;
  }

  return data ? data.value : null;
}

export async function writeJson(key, value) {
  const supabase = getClient();
  if (!supabase) {
    throw storageNotConfiguredError();
  }

  const { error } = await supabase.from(TABLE).upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString()
    },
    { onConflict: "key" }
  );

  if (error) {
    if (error.code === "PGRST205" || /prillaga_store/i.test(error.message || "")) {
      throw storageNotConfiguredError(
        "Database table missing. Run supabase/schema.sql in your Supabase SQL editor."
      );
    }
    if (error.code === "42501" || /permission denied/i.test(error.message || "")) {
      throw storageNotConfiguredError(
        "Supabase key lacks permission. Use the secret key (sb_secret_...) or service_role — not the publishable key."
      );
    }
    throw error;
  }

  return value;
}

export async function readJsonOrSeed(key, seedValue) {
  const existing = await readJson(key);
  if (existing != null) return existing;
  await writeJson(key, seedValue);
  return seedValue;
}

/** Shared Supabase client for storage uploads (service role). */
export function getSupabaseAdminClient() {
  return getClient();
}
