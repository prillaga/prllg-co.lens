export const STORAGE_KEY = "prillaga:bookings:v1";

export const VALID_UNIT_IDS = new Set([
  "nikon-kit",
  "nikon-zoom",
  "nikon-zoom-kit-battery",
  "canon-1200d",
  "canon-4000d",
  "g6-thumb",
  "kodak-v603",
  "zoom-lens",
  "dji-gimbal"
]);

export const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);

/** Initial data migrated from availability-public.json (approved blocks). */
export const SEED_BOOKINGS = [
  { id: "b-1778393451611", unitId: "nikon-zoom", start: "2026-04-30", end: "2026-05-04", status: "approved", staffBlock: true },
  { id: "b-1778393499870", unitId: "nikon-zoom", start: "2026-05-09", end: "2026-05-11", status: "approved", staffBlock: true },
  { id: "b-1778393526584", unitId: "nikon-kit", start: "2026-05-06", end: "2026-05-07", status: "approved", staffBlock: true },
  { id: "b-1778393563754", unitId: "nikon-zoom", start: "2026-05-13", end: "2026-05-14", status: "approved", staffBlock: true },
  { id: "b-1778393597439", unitId: "nikon-kit", start: "2026-05-23", end: "2026-05-25", status: "approved", staffBlock: true },
  { id: "b-1778393605471", unitId: "nikon-kit", start: "2026-05-26", end: "2026-05-26", status: "approved", staffBlock: true },
  { id: "b-1778860125113", unitId: "dji-gimbal", start: "2026-05-15", end: "2026-05-17", status: "approved", staffBlock: true },
  { id: "b-1778860151337", unitId: "nikon-kit", start: "2026-05-16", end: "2026-05-16", status: "approved", staffBlock: true },
  { id: "b-1778860170783", unitId: "nikon-kit", start: "2026-05-30", end: "2026-05-30", status: "approved", staffBlock: true },
  { id: "b-1779198932526", unitId: "nikon-kit", start: "2026-05-31", end: "2026-05-31", status: "approved", staffBlock: true },
  { id: "b-1779199070712", unitId: "nikon-kit", start: "2026-06-07", end: "2026-06-07", status: "approved", staffBlock: true },
  { id: "b-1779199111888", unitId: "nikon-kit", start: "2026-06-08", end: "2026-06-09", status: "approved", staffBlock: true },
  { id: "b-1779201025178", unitId: "nikon-kit", start: "2026-05-17", end: "2026-05-18", status: "approved", staffBlock: true },
  { id: "b-1779272399498", unitId: "canon-1200d", start: "2026-05-30", end: "2026-05-31", status: "approved", staffBlock: true },
  { id: "b-1779620788461", unitId: "nikon-zoom-kit-battery", start: "2026-05-26", end: "2026-05-27", status: "approved", staffBlock: true },
  { id: "b-1779941664833", unitId: "nikon-zoom", start: "2026-05-27", end: "2026-05-28", status: "approved", staffBlock: true },
  { id: "b-1779941678755", unitId: "canon-4000d", start: "2026-05-30", end: "2026-06-02", status: "approved", staffBlock: true }
];
