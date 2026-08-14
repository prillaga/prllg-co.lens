import { VALID_STATUSES, VALID_UNIT_IDS } from "./constants.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function compareDates(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sanitizeBooking(raw, validUnitIds) {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id || "").trim();
  const unitId = String(raw.unitId || "").trim();
  const start = String(raw.start || "").trim();
  const end = String(raw.end || "").trim();
  const status = String(raw.status || "").trim();

  if (!id || !unitId || !start || !end || !VALID_STATUSES.has(status)) return null;
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) return null;
  if (validUnitIds && !validUnitIds.has(unitId)) return null;
  if (!validUnitIds && !VALID_UNIT_IDS.has(unitId)) return null;
  if (compareDates(start, end) > 0) return null;

  const out = { id, unitId, start, end, status };

  if (raw.customerName != null && String(raw.customerName).trim()) {
    out.customerName = String(raw.customerName).trim().slice(0, 120);
  }
  if (raw.staffBlock) out.staffBlock = true;
  if (raw.createdAt != null && !Number.isNaN(Number(raw.createdAt))) {
    out.createdAt = Number(raw.createdAt);
  }
  if (raw.approvedAt != null && !Number.isNaN(Number(raw.approvedAt))) {
    out.approvedAt = Number(raw.approvedAt);
  }
  if (raw.rejectedReason != null && String(raw.rejectedReason).trim()) {
    out.rejectedReason = String(raw.rejectedReason).trim().slice(0, 200);
  }

  return out;
}

export function sanitizeBookings(rawList, validUnitIds) {
  if (!Array.isArray(rawList)) return [];
  const out = [];
  const seen = new Set();

  for (let i = 0; i < rawList.length; i++) {
    const item = sanitizeBooking(rawList[i], validUnitIds);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }

  return out;
}

export function toPublicBookings(bookings) {
  return bookings
    .filter(function (b) {
      return b.status === "approved" || b.status === "pending";
    })
    .map(function (b) {
      return {
        id: b.id,
        unitId: b.unitId,
        start: b.start,
        end: b.end,
        status: b.status === "pending" ? "pending" : "approved",
        staffBlock: b.status === "approved" ? !!b.staffBlock : false
      };
    });
}

export function normalizeStorePayload(raw) {
  if (Array.isArray(raw)) {
    return { bookings: sanitizeBookings(raw), updatedAt: Date.now() };
  }
  if (raw && typeof raw === "object") {
    return {
      bookings: sanitizeBookings(raw.bookings),
      updatedAt: Number(raw.updatedAt) || Date.now()
    };
  }
  return { bookings: [], updatedAt: Date.now() };
}
