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
  try { localStorage.setItem(KEY, 'null'); } catch { /* Shared storage may be disabled. */ }
  try { sessionStorage.removeItem(KEY); } catch { /* Storage can be disabled by the browser. */ }
}
export function readPortalSession(): PortalSession | null {
  try {
    let stored: string | null = null;
    try { stored = localStorage.getItem(KEY); } catch { /* Use tab storage if unavailable. */ }
    const legacy = stored === null;
    const value = JSON.parse((legacy ? sessionStorage.getItem(KEY) : stored) || 'null');
    if (!value) return null;
    if (!Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now() ||
        !Number.isInteger(value.account?.id) || value.account.id <= 0 ||
        typeof value.account.uniqueId !== 'string' ||
        !['client', 'referrer'].includes(value.account.role) ||
        typeof value.chatToken !== 'string' || typeof value.mustChangePassword !== 'boolean') {
      clearPortalSession(); return null;
    }
    if (legacy) {
      try { localStorage.setItem(KEY, JSON.stringify(value)); sessionStorage.removeItem(KEY); } catch { /* Keep the tab session as fallback. */ }
    }
    return value as PortalSession;
  } catch { clearPortalSession(); return null; }
}
export function savePortalSession(account: { id: number; uniqueId: string; [key: string]: unknown }, chatToken: string, mustChangePassword: boolean, expiresAt = Date.now() + LIFETIME) {
  // Persist only identity/display fields. Never persist passwords, files or form data.
  const safeAccount = Object.fromEntries(ACCOUNT_FIELDS.map(key => [key, account[key]]));
  const serialized = JSON.stringify({ account: safeAccount, chatToken, mustChangePassword, expiresAt });
  try { localStorage.setItem(KEY, serialized); sessionStorage.removeItem(KEY); }
  catch { try { sessionStorage.setItem(KEY, serialized); } catch { /* Login works without persistence. */ } }
}

// Other tabs must discard the previous account and any document currently displayed.
export function watchPortalSession() {
  const changed = (event: StorageEvent) => {
    if (event.storageArea === localStorage && (event.key === KEY || event.key === null)) window.location.reload();
  };
  window.addEventListener('storage', changed);
  return () => window.removeEventListener('storage', changed);
}
