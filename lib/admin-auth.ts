import 'server-only';

export function verifyAdminCredentials(email?: string | null, password?: string | null): boolean {
  const expectedEmail = process.env.INVESTOR_HUB_ADMIN_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.INVESTOR_HUB_ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) return false;

  const providedEmail = email?.trim().toLowerCase();
  const providedPassword = password?.trim();

  return providedEmail === expectedEmail && providedPassword === expectedPassword;
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.INVESTOR_HUB_ADMIN_EMAIL?.trim() &&
    process.env.INVESTOR_HUB_ADMIN_PASSWORD
  );
}
