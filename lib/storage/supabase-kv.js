import { createClient } from "@supabase/supabase-js";

const TABLE = "prillaga_store";

/** Default project URL — override with SUPABASE_URL on Vercel if needed. */
const DEFAULT_SUPABASE_URL = "https://fomyzhxajhwqkztfvkue.supabase.co";

function normalizeSupabaseUrl(raw) {
  return String(raw || "")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabaseUrl() {
  const raw =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  return normalizeSupabaseUrl(raw);
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
}

function validateKey(key) {
  if (!key) return { ok: false, reason: "missing" };
  if (/^sb_publishable_/i.test(key)) {
    return {
      ok: false,
      reason: "publishable",
      message:
        "Wrong key: sb_publishable_ is public-only. Use sb_secret_ or service_role in SUPABASE_SERVICE_ROLE_KEY on Vercel."
    };
  }
  return { ok: true };
}

export function getStorageDiagnostics() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const keyCheck = validateKey(key);
  const missing = [];
  if (!url) missing.push("SUPABASE_URL");
  if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)");
  else if (!keyCheck.ok && keyCheck.reason === "publishable") {
    missing.push("SUPABASE_SERVICE_ROLE_KEY — must be secret/service_role, not publishable");
  }

  return {
    configured: !!url && keyCheck.ok,
    urlSet: !!url,
    keySet: !!key,
    keyValid: keyCheck.ok,
    url: url || null,
    missing: missing,
    hint:
      missing.length === 0
        ? "Storage env vars look OK."
        : "Add missing vars in Vercel → Settings → Environment Variables → Production, then Redeploy."
  };
}

function getSupabaseConfig() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const keyCheck = validateKey(key);
  if (!url || !keyCheck.ok) return null;
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
  const diag = getStorageDiagnostics();
  let text =
    message ||
    "Site storage is not configured on the server.";

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
