import { sanitizeBookings, toPublicBookings } from "../lib/bookings/core.js";
import { SEED_BOOKINGS } from "../lib/bookings/constants.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sanitized = sanitizeBookings(SEED_BOOKINGS);
assert(sanitized.length === SEED_BOOKINGS.length, "seed bookings should all sanitize");

const pub = toPublicBookings(sanitized);
assert(pub.length === SEED_BOOKINGS.length, "public export should include approved seed rows");
assert(pub.every(function (b) {
  return b.id && b.unitId && b.start && b.end && (b.status === "approved" || b.status === "pending");
}), "public rows must have required fields");

const rejected = sanitizeBookings([
  { id: "x1", unitId: "nikon-kit", start: "2026-06-01", end: "2026-06-02", status: "rejected" }
]);
assert(rejected.length === 1, "rejected booking kept in admin store");

const publicFromRejected = toPublicBookings(rejected);
assert(publicFromRejected.length === 0, "rejected bookings hidden from public API");

const bad = sanitizeBookings([
  { id: "bad", unitId: "unknown-unit", start: "2026-06-01", end: "2026-06-02", status: "approved" }
]);
assert(bad.length === 0, "invalid unit id rejected");

console.log("bookings API core tests passed (" + pub.length + " public rows from seed).");
