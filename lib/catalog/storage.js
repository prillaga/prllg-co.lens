import { STORAGE_KEY, SEED_CATALOG } from "./constants.js";
import { getUnitIdSet, sanitizeCatalog, toPublicCatalog } from "./core.js";
import {
  isKvStorageConfigured,
  readJsonOrSeed,
  writeJson
} from "../storage/supabase-kv.js";

export function isCatalogStorageConfigured() {
  return isKvStorageConfigured();
}

export async function readCatalogStore() {
  const seeded = sanitizeCatalog(SEED_CATALOG);
  const raw = await readJsonOrSeed(STORAGE_KEY, seeded);
  return sanitizeCatalog(raw);
}

export async function writeCatalogStore(catalog) {
  const payload = sanitizeCatalog(catalog);
  await writeJson(STORAGE_KEY, payload);
  return payload;
}

export async function getPublicCatalog() {
  const store = await readCatalogStore();
  return toPublicCatalog(store);
}

export async function getAdminCatalog() {
  return readCatalogStore();
}

export async function saveAdminCatalog(raw) {
  return writeCatalogStore(raw);
}

export async function getCatalogUnitIdSet() {
  const store = await readCatalogStore();
  return getUnitIdSet(store);
}
