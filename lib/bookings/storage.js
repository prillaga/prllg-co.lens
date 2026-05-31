import { SEED_BOOKINGS, STORAGE_KEY } from "./constants.js";
import { normalizeStorePayload, toPublicBookings } from "./core.js";
import {
  isKvStorageConfigured,
  readJsonOrSeed,
  writeJson
} from "../storage/supabase-kv.js";

export function isStorageConfigured() {
  return isKvStorageConfigured();
}

export async function readBookingsStore() {
  const seed = {
    bookings: SEED_BOOKINGS.slice(),
    updatedAt: Date.now()
  };
  const raw = await readJsonOrSeed(STORAGE_KEY, seed);
  return normalizeStorePayload(raw);
}

export async function writeBookingsStore(bookings) {
  const payload = {
    bookings: bookings,
    updatedAt: Date.now()
  };
  await writeJson(STORAGE_KEY, payload);
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
  return writeBookingsStore(rawList);
}
