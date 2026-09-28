const KEY = 'sbr.portalSession.v1';
const LIFETIME = 8 * 60 * 60 * 1000;
const ACCOUNT_FIELDS = ['id', 'uniqueId', 'firstName', 'middleName', 'lastName', 'name', 'email', 'phone', 'leadType', 'source', 'status', 'role', 'referrerId', 'referralCode', 'profession'] as const;
export type PortalSession = {
  account: { id: number; uniqueId: string; role: 'client' | 'referrer'; [key: string]: unknown };
  chatToken: string;
  mustChangePassword: boolean;
  expiresAt: number;
};
export function clearPortalSession() {
  try { sessionStorage.removeItem(KEY); } catch { /* Storage can be disabled by the browser. */ }
}
export function readPortalSession(): PortalSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!value) return null;
    if (!Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now() ||
        !Number.isInteger(value.account?.id) || value.account.id <= 0 ||
        typeof value.account.uniqueId !== 'string' ||
        !['client', 'referrer'].includes(value.account.role) ||
        typeof value.chatToken !== 'string' || typeof value.mustChangePassword !== 'boolean') {
      clearPortalSession(); return null;
    }
    return value as PortalSession;
  } catch { clearPortalSession(); return null; }
}
export function savePortalSession(account: { id: number; uniqueId: string; [key: string]: unknown }, chatToken: string, mustChangePassword: boolean, expiresAt = Date.now() + LIFETIME) {
  // Persist only identity/display fields. Never persist passwords, files or form data.
  const safeAccount = Object.fromEntries(ACCOUNT_FIELDS.map(key => [key, account[key]]));
  try { sessionStorage.setItem(KEY, JSON.stringify({ account: safeAccount, chatToken, mustChangePassword, expiresAt })); }
  catch { /* Login can still work when session storage is unavailable. */ }
}
