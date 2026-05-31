export function getAdminPin() {
  return (process.env.PRILLAGA_ADMIN_PIN || "lens2026").trim();
}

export function isAuthorizedAdmin(req) {
  const headerPin = req.headers["x-admin-pin"];
  const pin = typeof headerPin === "string" ? headerPin.trim() : "";
  if (!pin) return false;
  return pin === getAdminPin();
}
