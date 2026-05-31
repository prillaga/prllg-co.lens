import { getCatalogUnitIdSet } from "../../lib/catalog/storage.js";
import { isAuthorizedAdmin } from "../../lib/auth.js";
import { sanitizeBookings } from "../../lib/bookings/core.js";
import { handleOptions, sendError, setJsonCors, storageErrorResponse } from "../../lib/bookings/http.js";
import { getAdminBookings, saveAdminBookings } from "../../lib/bookings/storage.js";

export default async function handler(req, res) {
  setJsonCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET" && req.method !== "PUT") {
    sendError(res, 405, "Method not allowed.");
    return;
  }

  if (!isAuthorizedAdmin(req)) {
    sendError(res, 401, "Unauthorized admin PIN.");
    return;
  }

  try {
    if (req.method === "GET") {
      const store = await getAdminBookings();
      res.status(200).json(store);
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const validUnitIds = await getCatalogUnitIdSet();
    const bookings = sanitizeBookings(body && body.bookings, validUnitIds);
    const store = await saveAdminBookings(bookings);
    res.status(200).json(store);
  } catch (err) {
    if (storageErrorResponse(res, err)) return;
    console.error("Admin bookings API failed:", err);
    sendError(res, 500, err.message || "Could not save availability.");
  }
}
