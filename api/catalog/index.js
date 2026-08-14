import { isAuthorizedAdmin } from "../../lib/auth.js";
import { handleOptions, sendError, setJsonCors, storageErrorResponse } from "../../lib/bookings/http.js";
import { getAdminCatalog, saveAdminCatalog } from "../../lib/catalog/storage.js";

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
      const catalog = await getAdminCatalog();
      res.status(200).json(catalog);
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const catalog = await saveAdminCatalog(body);
    res.status(200).json(catalog);
  } catch (err) {
    if (storageErrorResponse(res, err)) return;
    console.error("Admin catalog API failed:", err);
    sendError(res, 500, err.message || "Could not save catalog.");
  }
}
