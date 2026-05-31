import { Redis } from "@upstash/redis";
import { SEED_CATALOG, STORAGE_KEY } from "./constants.js";
import { getUnitIdSet, sanitizeCatalog, toPublicCatalog } from "./core.js";

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  if (!url || !token) return null;
  return { url, token };
}

function createRedisClient() {
  const config = getRedisConfig();
  if (!config) return null;
  return new Redis({ url: config.url, token: config.token });
}

export function isCatalogStorageConfigured() {
  return !!getRedisConfig();
}

export async function readCatalogStore() {
  const redis = createRedisClient();
  if (!redis) {
    const err = new Error("Catalog storage is not configured on the server.");
    err.code = "STORAGE_NOT_CONFIGURED";
    throw err;
  }

  const raw = await redis.get(STORAGE_KEY);
  if (!raw) {
    const seeded = sanitizeCatalog(SEED_CATALOG);
    await redis.set(STORAGE_KEY, seeded);
    return seeded;
  }

  return sanitizeCatalog(raw);
}

export async function writeCatalogStore(catalog) {
  const redis = createRedisClient();
  if (!redis) {
    const err = new Error("Catalog storage is not configured on the server.");
    err.code = "STORAGE_NOT_CONFIGURED";
    throw err;
  }

  const payload = sanitizeCatalog(catalog);
  await redis.set(STORAGE_KEY, payload);
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
