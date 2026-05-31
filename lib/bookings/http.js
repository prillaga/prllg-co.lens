export function setJsonCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Admin-Pin");
}

export function sendError(res, status, message, extra) {
  const body = { error: message };
  if (extra && typeof extra === "object") {
    Object.assign(body, extra);
  }
  res.status(status).json(body);
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    setJsonCors(res);
    res.status(204).end();
    return true;
  }
  return false;
}

export function storageErrorResponse(res, err) {
  if (err && err.code === "STORAGE_NOT_CONFIGURED") {
    sendError(res, 503, err.message, {
      setup:
        "Create a free Supabase project, run supabase/schema.sql, then set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel."
    });
    return true;
  }
  return false;
}
