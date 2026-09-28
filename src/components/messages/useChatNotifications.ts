import { useEffect, useState } from 'react';
export type ChatAlert = { clientId: number; name: string; unreadCount: number; lastMessageId: number; updatedAt: string };
const API = `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}/chat/notifications`;
export async function markChatRead(token: string, clientId: number, lastMessageId: number) {
  const response = await fetch(API, { method: 'PATCH', signal: AbortSignal.timeout(35000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, lastMessageId }) });
  if (!response.ok) throw new Error('Unable to update message alerts.');
  window.dispatchEvent(new Event('chat-alerts-changed'));
}
export function useChatNotifications(token: string) {
  const [items, setItems] = useState<ChatAlert[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    setItems([]);
    if (!token) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let busy = false;
    const load = async () => {
      if (busy || controller.signal.aborted) return;
      clearTimeout(timer); busy = true;
      try {
        const response = await fetch(API, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Message alerts unavailable.');
        if (!controller.signal.aborted) { setItems(data.notifications || []); setError(''); }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Message alerts unavailable.'); }
      finally { busy = false; if (!controller.signal.aborted) timer = setTimeout(load, 10000); }
    };
    void load();
    window.addEventListener('chat-alerts-changed', load);
    window.addEventListener('focus', load);
    return () => { controller.abort(); clearTimeout(timer); window.removeEventListener('chat-alerts-changed', load); window.removeEventListener('focus', load); };
  }, [token]);
  return { items, count: items.reduce((total, item) => total + item.unreadCount, 0), error };
}
