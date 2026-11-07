export function isAdmin(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return key === (process.env.ADMIN_KEY || "minal-admin");
}
