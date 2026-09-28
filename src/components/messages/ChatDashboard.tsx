import { markChatRead } from './useChatNotifications';
import { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaCommentDots, FaPaperPlane, FaSearch, FaSyncAlt } from 'react-icons/fa';

type Conversation = { id: number; name: string; uniqueId?: string; preview?: string; lastMessageId?: number; senderType?: string; updatedAt?: string };
type Message = { id: number; senderType: string; senderName: string; message: string; createdAt: string };
type Props = { token: string; role: 'Admin' | 'Client'; client?: Conversation; initialClientId?: number; onBack?: () => void; compact?: boolean; active?: boolean };
const API = `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}/chat`;
const date = (value?: string) => value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export default function ChatDashboard({ token, role, client, initialClientId, onBack, compact = false, active: isActive = true }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>(client ? [client] : []);
  const [selected, setSelected] = useState<number | null>(client?.id || initialClientId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(role === 'Admin');
  const [sending, setSending] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);
  const active = conversations.find(c => c.id === selected);
  const draft = selected ? drafts[selected] || '' : '';

  useEffect(() => {
    if (role !== 'Admin' || !token || !isActive) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const response = await fetch(API, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load conversations.');
        if (!controller.signal.aborted) { setConversations(result.conversations); setListError(''); }
      } catch (e) {
        if (!controller.signal.aborted) setListError(e instanceof Error ? e.message : 'Unable to load conversations.');
      } finally {
        if (!controller.signal.aborted) { setListLoading(false); timer = setTimeout(load, 15000); }
      }
    };
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [token, role, refresh, isActive]);

  useEffect(() => {
    if (!isActive) return;
    setMessages([]); setError('');
    if (!selected || !token) return;
    setLoading(true);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const response = await fetch(`${API}?clientId=${selected}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load messages.');
        if (!controller.signal.aborted) {
          setMessages(current => {
            const merged = new Map<number, Message>(current.map(m => [m.id, m]));
            for (const message of result.messages as Message[]) merged.set(message.id, message);
            return [...merged.values()].sort((a, b) => a.id - b.id);
          });
          const latest = (result.messages as Message[])[result.messages.length - 1];
          if (latest) setConversations(current => current.map(c => c.id === selected ? { ...c, preview: latest.message, updatedAt: latest.createdAt } : c));
          const incoming = (result.messages as Message[]).filter(m => m.senderType !== role);
          const lastIncoming = incoming[incoming.length - 1];
          if (lastIncoming && document.visibilityState === 'visible') {
            try { await markChatRead(token, selected, lastIncoming.id); } catch { /* Retain unread alert until acknowledgement succeeds. */ }
          }
          setError('');
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load messages.');
      } finally {
        if (!controller.signal.aborted) { setLoading(false); timer = setTimeout(load, 5000); }
      }
    };
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [selected, token, refresh, isActive, role]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [messages.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !draft.trim() || sending) return;
    setSending(true); setError('');
    try {
      const response = await fetch(API, { method: 'POST', signal: AbortSignal.timeout(35000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: selected, message: draft.trim() }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Message could not be sent.');
      setMessages(current => [...current.filter(m => m.id !== result.clientMessage.id), result.clientMessage].sort((a,b) => a.id-b.id));
      setDrafts(current => ({ ...current, [selected]: '' }));
      setConversations(current => current.map(c => c.id === selected ? { ...c, preview: result.clientMessage.message, updatedAt: result.clientMessage.createdAt } : c));
    } catch (e) {
      setError(e instanceof Error ? `${e.message} Your draft has been kept.` : 'Unable to send. Your draft has been kept.');
    } finally { setSending(false); }
  };

  if (!token) return <div className="rounded-2xl border bg-white p-8"><h2 className="text-xl font-black">Sign in to Messages</h2><p className="mt-2 text-slate-600">Please log out and sign in again to start a messaging session.</p>{onBack && <button onClick={onBack} className="mt-5 font-bold text-teal-700">Back to documents</button>}</div>;
  const filtered = conversations.filter(c => `${c.name} ${c.uniqueId || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <section className={`flex ${compact ? "h-full min-h-0" : "h-[calc(100dvh-150px)] min-h-[520px] rounded-3xl border border-slate-200 shadow-sm"} overflow-hidden bg-white`} aria-label="Messages dashboard">
    {!compact && <aside className={`${selected ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-teal-100 bg-gradient-to-b from-white to-teal-50/50 md:w-80`}>
      <div className="chat-list-heading border-b border-teal-100 p-5">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-black text-slate-900">Messages</h1><button aria-label="Refresh conversations" onClick={() => setRefresh(v => v + 1)} className="rounded-full p-2 text-teal-700 hover:bg-teal-50"><FaSyncAlt /></button></div>
        <p className="mt-1 text-sm text-slate-500">{role === 'Admin' ? 'Your client conversations' : 'Your SBR Funding team'}</p>
        {role === 'Admin' && <label className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2"><FaSearch className="text-slate-400" /><input aria-label="Search conversations" placeholder="Search name or client ID" value={search} onChange={e => setSearch(e.target.value)} className="min-w-0 w-full bg-transparent text-sm outline-none" /></label>}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {listError && <p role="alert" className="p-3 text-sm text-red-700">{listError}</p>}
        {listLoading && <p className="p-4 text-sm text-slate-500">Loading conversations…</p>}
        {!listLoading && !filtered.length && <p className="p-4 text-sm text-slate-500">No conversations found.</p>}
        {filtered.map(c => <button key={c.id} disabled={sending} onClick={() => setSelected(c.id)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-60 ${selected === c.id ? 'bg-gradient-to-r from-teal-100 to-white ring-1 ring-inset ring-teal-200 shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-slate-800 font-bold text-white shadow-sm">{role === 'Client' ? <FaCommentDots /> : c.name.charAt(0).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate font-bold text-slate-900">{role === 'Client' ? 'SBR Funding Team' : c.name}</span><span className="block truncate text-xs text-slate-500">{c.uniqueId}</span><span className="mt-1 block truncate text-sm text-slate-500">{c.preview || 'Start a conversation'}</span></span>
        </button>)}
      </div>
      {onBack && <button onClick={onBack} className="flex items-center gap-2 border-t p-5 font-bold text-teal-700"><FaArrowLeft /> Document dashboard</button>}
    </aside>}
    <div className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
      {selected ? <>
        {!compact && <header className="chat-brand-header flex shrink-0 items-center gap-3 border-b border-teal-900/10 px-4 py-4 text-white sm:px-6">
          <button disabled={sending} onClick={() => setSelected(null)} aria-label="Back to conversations" className="rounded-full p-2 md:hidden"><FaArrowLeft /></button>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-bold">{role === 'Client' ? <FaCommentDots /> : (active?.name || 'C').charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><h2 className="truncate font-black text-white">{role === 'Client' ? 'SBR Funding Team' : active?.name || 'Client conversation'}</h2><p className="text-xs text-teal-100">{role === 'Client' ? 'Ask questions about your scenario' : active?.uniqueId}</p></div>
          {onBack && <button onClick={onBack} className="text-sm font-bold text-teal-700">Documents</button>}
        </header>}
        <div className="chat-pattern flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" role="log" aria-label="Conversation messages" aria-live="polite">
          {loading && <p className="text-center text-sm text-slate-500">Loading messages…</p>}
          {!loading && !messages.length && !error && <div className="py-20 text-center text-slate-500"><FaCommentDots className="mx-auto mb-3 text-4xl text-teal-500" /><p className="font-bold">Start the conversation</p><p className="mt-1 text-sm">Messages about this scenario will appear here.</p></div>}
          {messages.map(m => <article key={m.id} className={`flex ${m.senderType === role ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${m.senderType === role ? 'chat-bubble-outgoing rounded-br-sm text-white' : 'chat-bubble-incoming rounded-bl-sm text-slate-800'}`}><p className="mb-1 text-xs font-bold opacity-80">{m.senderType === role ? 'You' : m.senderType === 'Admin' ? 'SBR Funding Team' : m.senderName}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{m.message}</p><time className="mt-2 block text-right text-[10px] opacity-70">{date(m.createdAt)}</time></div></article>)}
          <div ref={bottom} />
        </div>
        {error && <p role="alert" className="border-t bg-red-50 px-5 py-3 text-sm text-red-700">{error} <button onClick={() => setRefresh(v => v+1)} className="font-bold underline">Refresh</button></p>}
        <form onSubmit={send} className="chat-composer border-t border-teal-100 p-4"><div className="flex items-end gap-3 rounded-2xl border border-teal-100 bg-white p-3 shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100"><textarea aria-label="Message" placeholder="Write a message…" rows={2} maxLength={2000} value={draft} disabled={sending} onChange={e => setDrafts(current => ({ ...current, [selected]: e.target.value }))} className="max-h-36 min-w-0 flex-1 resize-y bg-transparent text-sm outline-none" /><button type="submit" aria-label="Send message" disabled={sending || !draft.trim() || loading} className="rounded-xl bg-teal-600 p-3 text-white hover:bg-teal-700 disabled:opacity-40"><FaPaperPlane /></button></div><div className="mt-2 flex justify-between text-xs text-slate-400"><span>{sending ? 'Sending…' : 'Messages refresh automatically'}</span><span>{draft.length}/2,000</span></div></form>
      </> : <div className="m-auto p-8 text-center text-slate-500"><FaCommentDots className="mx-auto mb-4 text-5xl text-teal-500" /><h2 className="text-xl font-bold text-slate-800">Your conversations, together</h2><p className="mt-2 text-sm">Select a client to read and reply to their messages.</p></div>}
    </div>
  </section>;
}
