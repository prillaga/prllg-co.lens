/** Env-only diagnostics — no Supabase SDK import (safe for /api/health). */

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

export function getSupabaseUrlForClient() {
  return getSupabaseUrl();
}

export function getSupabaseKeyForClient() {
  return getSupabaseKey();
}

export function isStorageEnvConfigured() {
  const keyCheck = validateKey(getSupabaseKey());
  return !!getSupabaseUrl() && keyCheck.ok;
}
