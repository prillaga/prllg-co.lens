import { createClient } from "@supabase/supabase-js";

const TABLE = "prillaga_store";

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  return { url, key };
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
  return !!getSupabaseConfig();
}

export function storageNotConfiguredError(message) {
  const err = new Error(
    message ||
      "Site storage is not configured on the server."
  );
  err.code = "STORAGE_NOT_CONFIGURED";
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
