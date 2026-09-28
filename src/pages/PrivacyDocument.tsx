import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PrivacyAuthority from '@/components/PrivacyAuthority';
import SignaturePad from '@/components/SignaturePad';
import { readPortalSession } from '@/lib/portalSession';
import { documentDate, type SigningSubmission } from '@/lib/signingSubmission';

type Document = { submission: SigningSubmission; revision: string; templateVersion: number; id?: string; signedAt?: string; signatures?: Record<string, { image: string; signedAt: string }> };
const API = `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}/privacy-document`;
export default function PrivacyDocument() {
  const [session] = useState(readPortalSession);
  const [document, setDocument] = useState<Document | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!session?.chatToken || session.account.role !== 'client') return;
    const controller = new AbortController();
    let active = true;
    setError('');
    const timer = window.setTimeout(() => {
      if (active) { setError('The server is taking too long to respond. Please try again.'); controller.abort(); }
    }, 30000);
    fetch(API, { headers: { Authorization: `Bearer ${session.chatToken}` }, signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to load document.'); if (active) setDocument(data); })
      .catch(e => { if (active && !controller.signal.aborted) setError(e.message); })
      .finally(() => window.clearTimeout(timer));
    return () => { active = false; window.clearTimeout(timer); controller.abort(); };
  }, [session, attempt]);
  const ready = document && document.submission.borrowers.every(b => images[b.id] && consents[b.id]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy || !document || document.signedAt) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.chatToken}` }, body: JSON.stringify({ revision: document.revision, templateVersion: document.templateVersion, signatures: Object.fromEntries(document.submission.borrowers.map(b => [b.id, { image: images[b.id], consent: consents[b.id] }])) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save document.');
      setDocument(data); setImages({}); setConsents({});
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save document.'); }
    finally { setBusy(false); }
  }
  const authenticated = session?.chatToken && session.account.role === 'client';
  return <main className="min-h-screen bg-[#eef8f6] px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-4xl">
      <header className="chat-brand-header mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-white"><div><h1 className="text-2xl font-black">Privacy Statement and Authority</h1><p className="mt-1 text-sm text-white/80">{document?.signedAt ? 'Signed document · Saved to your account' : 'Review your details and sign below'}</p></div><Link to="/clients" className="rounded-xl bg-white/15 px-4 py-2 font-bold">Back to portal</Link></header>
      {!authenticated ? <p className="rounded-xl bg-white p-6">Please <Link to="/clients" className="text-teal-700 underline">sign in to the client portal</Link> to open your document.</p> : <>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error}{!document && <button onClick={() => setAttempt(v => v + 1)} className="ml-3 font-bold underline">Try again</button>}</p>}
        {!document && !error && <p role="status">Loading your saved submission…</p>}
        {document && <form onSubmit={submit} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-teal-50 p-4 text-sm text-teal-900">Submission {document.submission.uniqueId} · {document.signedAt ? 'Your signatures are saved. Reopening this page shows the completed document.' : 'Names and the document date are loaded from your saved submission.'}</div>
          <PrivacyAuthority date={documentDate(document.submission.submittedAt)}>
            {document.submission.borrowers.map((borrower, index) => {
              const signature = document.signatures?.[borrower.id];
              return <section key={borrower.id} aria-label={`Signature for ${borrower.name}`} className="break-inside-avoid space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr_.7fr] sm:items-end">
                  <div><p className="min-h-10 border-b border-black pb-2 font-semibold">{borrower.name}</p><p className="mt-1 text-xs">Name of {index === 0 ? 'Borrower' : 'Co-borrower'}</p></div>
                  <div>{signature ? <img src={signature.image} alt={`Handwritten signature of ${borrower.name}`} className="h-20 w-full object-contain" /> : <p className="min-h-10 text-xs text-slate-400">Draw your signature below</p>}<p className="border-t border-black pt-1 text-xs">Signature</p></div>
                  <div><p className="min-h-10 border-b border-black pb-2 text-xs">{signature ? documentDate(signature.signedAt) : 'Not signed yet'}</p><p className="mt-1 text-xs">Date signed</p></div>
                </div>
                {!document.signedAt && <><SignaturePad value={images[borrower.id] || ''} onChange={image => { setImages(v => ({ ...v, [borrower.id]: image })); setConsents(v => ({ ...v, [borrower.id]: false })); }} /><label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" disabled={busy} checked={consents[borrower.id] || false} onChange={event => setConsents(v => ({ ...v, [borrower.id]: event.target.checked }))} />I am {borrower.name}. I have read this document and agree to sign it electronically with my handwritten signature.</label></>}
              </section>;
            })}
          </PrivacyAuthority>
          <div className="border-t bg-teal-50 p-5">{document.signedAt ? <p className="font-semibold text-teal-800">Signed and saved. Your completed document is read-only.</p> : <><p className="mb-3 text-sm text-slate-600">Each listed borrower must draw their own signature. Submission saves the completed document to your account.</p><button disabled={!ready || busy} className="rounded-xl bg-teal-700 px-6 py-3 font-bold text-white disabled:opacity-40">{busy ? 'Saving…' : 'Submit signed document'}</button></>}</div>
        </form>}
      </>}
    </div>
  </main>;
}
