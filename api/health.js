import { getStorageDiagnostics } from "../../lib/storage/supabase-kv.js";
import { handleOptions, sendError, setJsonCors } from "../../lib/bookings/http.js";

export default async function handler(req, res) {
  setJsonCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    sendError(res, 405, "Method not allowed.");
    return;
  }

  const diag = getStorageDiagnostics();
  res.status(diag.configured ? 200 : 503).json({
    ok: diag.configured,
    storage: "supabase",
    ...diag
  });
}
