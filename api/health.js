import { getStorageDiagnostics } from "../../lib/storage/diagnostics.js";
import { handleOptions, sendError, setJsonCors } from "../../lib/bookings/http.js";

export default async function handler(req, res) {
  setJsonCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    sendError(res, 405, "Method not allowed.");
    return;
  }

  try {
    const diag = getStorageDiagnostics();
    res.status(diag.configured ? 200 : 503).json({
      ok: diag.configured,
      storage: "supabase",
      ...diag
    });
  } catch (err) {
    console.error("GET /api/health failed:", err);
    sendError(res, 500, err.message || "Health check failed.");
  }
}
