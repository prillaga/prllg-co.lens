import { getPublicCatalog } from "../../lib/catalog/storage.js";
import { handleOptions, sendError, setJsonCors, storageErrorResponse } from "../../lib/bookings/http.js";

export default async function handler(req, res) {
  setJsonCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    sendError(res, 405, "Method not allowed.");
    return;
  }

  try {
    const catalog = await getPublicCatalog();
    res.status(200).json(catalog);
  } catch (err) {
    if (storageErrorResponse(res, err)) return;
    console.error("GET /api/catalog/public failed:", err);
    sendError(res, 500, "Could not load catalog.");
  }
}
