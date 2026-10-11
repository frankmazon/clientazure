import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/layout';
import PrivacyAuthority from '@/components/PrivacyAuthority';
import { documentDate, type SigningSubmission } from '@/lib/signingSubmission';
import { isChatTokenExpired } from '@/lib/chatSession';

type SavedDocument = { submission: SigningSubmission; signedAt?: string; signatures?: Record<string, { image: string; signedAt: string }> };
const API = `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}/admin/privacy-document`;

export default function AdminPrivacyDocument() {
  const { clientId } = useParams();
  const [document, setDocument] = useState<SavedDocument | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const token = sessionStorage.getItem('adminChatToken') || '';
    setDocument(null); setError(''); setExpired(false);
    if (isChatTokenExpired(token)) { setExpired(true); return; }
    const controller = new AbortController();
    fetch(`${API}?clientId=${encodeURIComponent(clientId || '')}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
    }).then(async response => {
      if (response.status === 401) { if (!controller.signal.aborted) setExpired(true); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load Privacy Authority.');
      if (!controller.signal.aborted) setDocument(data);
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load document.'); });
    return () => controller.abort();
  }, [clientId, attempt]);
  return <DashboardLayout title="Privacy Authority" subtitle="Review the client's saved document and signatures.">
    <div className="mx-auto max-w-5xl space-y-4">
      <Link to="/dashboard/client-search" className="inline-block font-bold text-teal-700">← Back to clients</Link>
      {expired && <p role="alert">Your session expired. <Link to="/admin" className="underline">Sign in again</Link> to view the document.</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error} <button onClick={() => setAttempt(v => v + 1)} className="font-bold underline">Try again</button></p>}
      {!document && !error && !expired && <p role="status">Loading Privacy Authority…</p>}
      {document && <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-teal-50 p-4 font-semibold text-teal-900">{document.submission.uniqueId} · {document.signedAt ? 'Signed · Saved document (read-only)' : 'Not signed · Awaiting client signatures'}</div>
        <PrivacyAuthority date={documentDate(document.submission.submittedAt)}>
          {document.submission.borrowers.map((borrower, index) => {
            const signature = document.signatures?.[borrower.id];
            return <section key={borrower.id} className="grid break-inside-avoid gap-4 sm:grid-cols-[1fr_1.2fr_.7fr] sm:items-end">
              <div><p className="min-h-10 border-b border-black pb-2 font-semibold">{borrower.name}</p><p className="mt-1 text-xs">Name of {index === 0 ? 'Borrower' : 'Co-borrower'}</p></div>
              <div>{signature ? <img src={signature.image} alt={`Handwritten signature of ${borrower.name}`} className="h-20 w-full object-contain" /> : <p className="min-h-10 text-sm text-slate-500">Not signed</p>}<p className="border-t border-black pt-1 text-xs">Signature</p></div>
              <div><p className="min-h-10 border-b border-black pb-2 text-xs">{signature ? documentDate(signature.signedAt) : 'Not signed'}</p><p className="mt-1 text-xs">Date signed</p></div>
            </section>;
          })}
        </PrivacyAuthority>
      </article>}
    </div>
  </DashboardLayout>;
}
