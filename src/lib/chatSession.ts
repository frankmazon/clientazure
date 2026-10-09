/** Expiry is a UI hint only; the API still verifies the token's signature. */
export function isChatTokenExpired(token: string, now = Date.now()): boolean {
  if (!token) return true;
  try {
    const encoded = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp)
      ? payload.exp * 1000 <= now + 5000
      : false;
  } catch {
    // Unknown formats must still be validated by the server.
    return false;
  }
}
