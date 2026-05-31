import { Redis } from "@upstash/redis";
import { SEED_BOOKINGS, STORAGE_KEY } from "./constants.js";
import { normalizeStorePayload, toPublicBookings } from "./core.js";

function getRedisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    "";

  if (!url || !token) return null;
  return { url, token };
}

function createRedisClient() {
  const config = getRedisConfig();
  if (!config) return null;
  return new Redis({ url: config.url, token: config.token });
}

export function isStorageConfigured() {
  return !!getRedisConfig();
}

export async function readBookingsStore() {
  const redis = createRedisClient();
  if (!redis) {
    const err = new Error("Availability storage is not configured on the server.");
    err.code = "STORAGE_NOT_CONFIGURED";
    throw err;
  }

  const raw = await redis.get(STORAGE_KEY);
  if (!raw) {
    const seeded = {
      bookings: SEED_BOOKINGS.slice(),
      updatedAt: Date.now()
    };
    await redis.set(STORAGE_KEY, seeded);
    return seeded;
  }

  return normalizeStorePayload(raw);
}

export async function writeBookingsStore(bookings) {
  const redis = createRedisClient();
  if (!redis) {
    const err = new Error("Availability storage is not configured on the server.");
    err.code = "STORAGE_NOT_CONFIGURED";
    throw err;
  }

  const payload = {
    bookings: bookings,
    updatedAt: Date.now()
  };
  await redis.set(STORAGE_KEY, payload);
  return payload;
}

export async function getPublicBookings() {
  const store = await readBookingsStore();
  return toPublicBookings(store.bookings);
}

export async function getAdminBookings() {
  return readBookingsStore();
}

export async function saveAdminBookings(rawList) {
  const store = await writeBookingsStore(rawList);
  return store;
}
