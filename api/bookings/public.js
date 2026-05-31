import { getPublicBookings } from "../../lib/bookings/storage.js";
import { handleOptions, sendError, setJsonCors, storageErrorResponse } from "../../lib/bookings/http.js";

export default async function handler(req, res) {
  setJsonCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    sendError(res, 405, "Method not allowed.");
    return;
  }

  try {
    const bookings = await getPublicBookings();
    res.status(200).json(bookings);
  } catch (err) {
    if (storageErrorResponse(res, err)) return;
    console.error("GET /api/bookings/public failed:", err);
    sendError(res, 500, "Could not load availability.");
  }
}
