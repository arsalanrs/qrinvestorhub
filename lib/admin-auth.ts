import 'server-only';

type OpsUser = {
  email: string;
  password: string;
  name?: string;
};

let cachedOpsUsers: OpsUser[] | null = null;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getOpsUsers(): OpsUser[] {
  if (cachedOpsUsers) return cachedOpsUsers;

  const users: OpsUser[] = [];
  const raw = process.env.INVESTOR_HUB_OPS_USERS_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const o = entry as Record<string, unknown>;
          const email = String(o.email ?? '').trim();
          const password = String(o.password ?? '').trim();
          if (email && password) {
            users.push({
              email: normalizeEmail(email),
              password,
              ...(o.name ? { name: String(o.name).trim() } : {}),
            });
          }
        }
      }
    } catch {
      // fall through to legacy single-user env
    }
  }

  const legacyEmail = process.env.INVESTOR_HUB_ADMIN_EMAIL?.trim();
  const legacyPassword = process.env.INVESTOR_HUB_ADMIN_PASSWORD?.trim();
  if (legacyEmail && legacyPassword) {
    const normalized = normalizeEmail(legacyEmail);
    if (!users.some(u => u.email === normalized)) {
      users.push({ email: normalized, password: legacyPassword });
    }
  }

  cachedOpsUsers = users;
  return users;
}

export function verifyAdminCredentials(email?: string | null, password?: string | null): boolean {
  const users = getOpsUsers();
  if (users.length === 0) return false;

  const providedEmail = normalizeEmail(email || '');
  const providedPassword = password?.trim() || '';

  return users.some(u => u.email === providedEmail && u.password === providedPassword);
}

export function isAdminConfigured(): boolean {
  return getOpsUsers().length > 0;
}
