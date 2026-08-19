export const DEFAULT_ADMIN_GITHUB_LOGIN = "Erickpe8";

export function adminLogins(): string[] {
  const extra = process.env.ADMIN_GITHUB_LOGINS ?? "";
  const fromEnv = extra
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const defaults = [DEFAULT_ADMIN_GITHUB_LOGIN.toLowerCase()];
  return [...new Set([...defaults, ...fromEnv])];
}

export function isAdminLogin(login: string | null | undefined): boolean {
  if (!login) return false;
  return adminLogins().includes(login.trim().toLowerCase());
}
