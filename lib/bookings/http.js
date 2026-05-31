export function setJsonCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
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
    const extra = {
      setup:
        "Vercel → Settings → Environment Variables → add SUPABASE_SERVICE_ROLE_KEY (secret key from Supabase), then Redeploy. Check /api/health for details."
    };
    if (err.diagnostics) {
      extra.missing = err.diagnostics.missing;
      extra.hint = err.diagnostics.hint;
    }
    sendError(res, 503, err.message, extra);
    return true;
  }
  return false;
}
