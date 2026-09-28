import PrivacyAuthority from '@/components/PrivacyAuthority';
import { readSigningSubmission, sampleSubmission, documentDate, type SigningSubmission } from '@/lib/signingSubmission';
import SignaturePad from '@/components/SignaturePad';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaEnvelope, FaFileSignature, FaArrowRight, FaPrint } from 'react-icons/fa';

type SignedSample = { id: string; name: string; signedAt: string; version: 2; submission: SigningSubmission; signatures: Record<string, { image: string; signedAt: string }> };
const PREFIX = 'sbr.signing-demo.';
function loadSample(id: string | null): SignedSample | null {
  if (!id) return null;
  try {
    const data = JSON.parse(localStorage.getItem(PREFIX + id) || 'null');
    return data?.id === id && typeof data.name === 'string' && typeof data.signedAt === 'string' && data.version === 2 && Array.isArray(data.submission?.borrowers) && data.submission.borrowers.length && data.submission.borrowers.every((b: { id: string }) => data.signatures?.[b.id]?.image?.startsWith('data:image/png;base64,')) ? data : null;
  } catch { return null; }
}
export default function SigningDemo() {
  const [params, setParams] = useSearchParams();
  const [signed, setSigned] = useState(() => loadSample(params.get('document')));
  const [view, setView] = useState<'email' | 'document'>(() => params.has('document') ? 'document' : 'email');
  const [captured] = useState(readSigningSubmission);
  const [submission, setSubmission] = useState(() => captured || sampleSubmission(false));
  const [signatures, setSignatures] = useState<Record<string, { image: string; signedAt: string }>>({});
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const activeSubmission = signed?.submission || submission;
  const ready = submission.borrowers.every(b => signatures[b.id]?.image && consents[b.id]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const missing = params.has('document') && !signed;
  const sign = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || signed || missing) return;
    const sample: SignedSample = { id: crypto.randomUUID(), name: submission.borrowers[0].name, signedAt: new Date().toISOString(), version: 2, submission, signatures };
    try {
      localStorage.setItem(PREFIX + sample.id, JSON.stringify(sample));
      setSigned(sample); setParams({ document: sample.id }); setError(''); setView('email');
    } catch { setError('The browser could not save this sample. Enable browser storage and try again.'); }
  };
  const restart = () => { setParams({}); setSigned(null); setSignatures({}); setConsents({}); setError(''); setCopied(false); setView('email'); };
  const link = signed ? `${window.location.origin}/signing-demo?document=${encodeURIComponent(signed.id)}` : '';
  return <main className="min-h-screen bg-[#eef8f6] px-4 py-8 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><img src="/logo/logo.png" alt="SBR Funding" className="h-14 w-14 rounded-xl bg-white p-2" /><div><h1 className="text-xl font-black">Document signing sample</h1><p className="text-sm text-slate-500">Email → Review → Sign → Reopen</p></div></div>
        <button onClick={restart} className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-bold text-teal-700">Start a new sample</button>
      </header>
      <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Demo only.</strong> Template preview based on your supplied Privacy Statement and Authority. No emails are sent. Saved signatures remain in this browser only; this is not a production signing service.</p>
      {!signed && !missing && <div className="mb-6 rounded-xl border border-teal-200 bg-white p-4 text-sm">
        <p className="font-bold">{captured ? `Prefilled from submission ${captured.uniqueId} in this browser tab` : 'Sample submission data'}</p>
        <p className="mt-1 text-slate-500">Names and the document date come from the submission. Each signature records its own signing date.</p>
        {!captured && <div className="mt-3 flex gap-2">{[false, true].map(withCo => <button key={String(withCo)} onClick={() => { setSubmission(sampleSubmission(withCo)); setSignatures({}); setConsents({}); }} className={`rounded-lg border px-3 py-2 ${submission.borrowers.length === (withCo ? 2 : 1) ? 'border-teal-600 bg-teal-50 font-bold' : 'border-slate-200'}`}>{withCo ? 'With co-borrower' : 'One borrower'}</button>)}</div>}
      </div>}
      <nav className="mb-6 flex gap-2" aria-label="Sample views">
        <button onClick={() => setView('email')} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${view === 'email' ? 'bg-teal-700 text-white' : 'bg-white text-slate-600'}`}><FaEnvelope />{signed ? 'Confirmation email preview' : 'Invitation email preview'}</button>
        <button onClick={() => setView('document')} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${view === 'document' ? 'bg-teal-700 text-white' : 'bg-white text-slate-600'}`}><FaFileSignature />Document</button>
      </nav>
      {view === 'email' ? <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4 text-sm text-slate-500"><p>From: SBR Funding Team <span className="text-xs">(preview)</span></p><p className="mt-1 font-bold text-slate-800">Subject: {signed ? 'Your signed document is ready' : 'Please review and sign your document'}</p></div>
        <div className="chat-brand-header p-8 text-white"><FaFileSignature className="mb-4 text-3xl" /><h2 className="text-2xl font-black">{signed ? 'Thank you for signing' : 'Your document is ready'}</h2><p className="mt-2 text-white/80">{signed ? 'Your signature has been saved with this sample.' : 'Review your document and add your signature online.'}</p></div>
        <div className="space-y-5 p-6 sm:p-8"><p>Dear {signed?.name || submission.borrowers[0].name},</p><p className="text-slate-600">{signed ? 'Open the link below to view the completed document, including your saved signature.' : 'Please open the document below, read the sample declaration, and sign when you are ready.'}</p>
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-4"><p className="font-bold">Privacy Statement and Authority</p><p className="mt-1 text-sm text-slate-500">{signed ? 'Signed · Read-only copy' : 'One document · Signature requested'}</p></div>
          <button onClick={() => setView('document')} className="inline-flex items-center gap-3 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800">{signed ? 'View signed document' : 'Review & sign document'}<FaArrowRight /></button>
          {signed && <div className="border-t pt-4"><p className="mb-2 text-xs text-slate-500">Reopen link (works in this browser only):</p><a href={link} className="block break-all text-sm text-teal-700 underline">{link}</a><button className="mt-3 text-sm font-bold text-teal-700" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError('Copy the link above manually.'); } }}>{copied ? 'Link copied' : 'Copy sample link'}</button></div>}
          <p className="text-sm text-slate-500">Kind regards,<br /><strong>SBR Funding Team</strong></p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      </section> : missing ? <section className="rounded-2xl bg-white p-8"><h2 className="text-xl font-bold">Sample not found in this browser</h2><p className="mt-3 text-slate-600">This demo link needs the browser where the sample was signed. Start a new sample to try the flow here.</p></section> : <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-teal-50 px-6 py-4"><span className="flex items-center gap-2 font-bold text-teal-800">{signed ? <FaCheckCircle /> : <FaFileSignature />}{signed ? 'Signed document · Read only' : 'Review document'}</span>{signed && <button onClick={() => window.print()} className="flex items-center gap-2 text-sm font-bold text-teal-700"><FaPrint />Print / Save as PDF</button>}</div>
        <form onSubmit={sign}>
          <PrivacyAuthority date={documentDate(activeSubmission.submittedAt)}>
            {activeSubmission.borrowers.map((borrower, index) => {
              const entry = signed ? signed.signatures[borrower.id] : signatures[borrower.id];
              return <section key={borrower.id} aria-label={`Signature for ${borrower.name}`} className="break-inside-avoid">
                <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr_.7fr] sm:items-end">
                  <div><p className="min-h-10 border-b border-black pb-2 font-semibold">{borrower.name}</p><p className="mt-1 text-xs">Name of {index === 0 ? 'Borrower' : 'Co-borrower'}</p></div>
                  <div>{signed && entry ? <img src={entry.image} alt={`Handwritten signature of ${borrower.name}`} className="h-20 w-full object-contain object-left" /> : <p className="min-h-10 text-xs text-slate-400">Draw in the pad below</p>}<p className="border-t border-black pt-1 text-xs">Signature of {index === 0 ? 'Borrower' : 'Co-borrower'}</p></div>
                  <div><p className="min-h-10 border-b border-black pb-2 text-xs">{entry?.signedAt ? documentDate(entry.signedAt) : 'Not signed yet'}</p><p className="mt-1 text-xs">Date signed</p></div>
                </div>
                {!signed && <div className="mt-4 space-y-3">
                  <SignaturePad value={entry?.image || ''} onChange={image => { setSignatures(current => ({ ...current, [borrower.id]: { image, signedAt: image ? new Date().toISOString() : '' } })); setConsents(current => ({ ...current, [borrower.id]: false })); }} />
                  <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={consents[borrower.id] || false} onChange={e => setConsents(current => ({ ...current, [borrower.id]: e.target.checked }))} className="mt-0.5 accent-teal-700" />I am {borrower.name}, and I have reviewed this sample and agree to add my handwritten signature.</label>
                </div>}
              </section>;
            })}
          </PrivacyAuthority>
          {!signed && <div className="border-t bg-teal-50 px-6 py-5"><p className="mb-3 text-sm text-slate-600">Each listed borrower must draw their own signature and confirm before submitting.</p>{error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<button disabled={!ready} className="rounded-xl bg-teal-700 px-6 py-3 font-bold text-white disabled:opacity-40">Submit signed document</button></div>}
        </form>
      </section>}
    </div>
  </main>;
}
