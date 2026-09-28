export type SigningSubmission = { uniqueId: string; submittedAt: string; borrowers: { id: string; name: string }[] };
const KEY = 'sbr.signing-submission-demo';
export function captureSigningSubmission(uniqueId: string, primary: { firstName: string; middleName?: string; lastName: string }, coBorrowers: { firstName: string; middleName?: string; lastName: string }[], submittedAt = new Date().toISOString()) {
  const borrowers = [primary, ...coBorrowers].map((p, i) => ({ id: `borrower-${i}`, name: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ').trim() }));
  const data: SigningSubmission = { uniqueId, submittedAt, borrowers };
  try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch { /* Demo storage must not interrupt submission. */ }
}
export function readSigningSubmission(): SigningSubmission | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return data && typeof data.uniqueId === 'string' && !isNaN(Date.parse(data.submittedAt)) && Array.isArray(data.borrowers) && data.borrowers.length && data.borrowers.every((b: { id?: unknown; name?: unknown }) => typeof b.id === 'string' && typeof b.name === 'string' && b.name.trim()) ? data : null;
  } catch { return null; }
}
export function sampleSubmission(withCoBorrower: boolean): SigningSubmission {
  return { uniqueId: 'SAMPLE', submittedAt: new Date().toISOString(), borrowers: [{ id: 'borrower-0', name: 'Alex Sample' }, ...(withCoBorrower ? [{ id: 'borrower-1', name: 'Jamie Sample' }] : [])] };
}
export const documentDate = (value: string) => new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne' });
