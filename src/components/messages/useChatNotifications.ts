import { isChatTokenExpired } from '@/lib/chatSession';
import { useEffect, useState } from 'react';
export type ChatAlert = { clientId: number; name: string; unreadCount: number; lastMessageId: number; updatedAt: string };
const API = `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}/chat/notifications`;
export async function markChatRead(token: string, clientId: number, lastMessageId: number) {
  if (isChatTokenExpired(token)) throw new Error('Your messaging session expired. Please sign in again.');
  const response = await fetch(API, { method: 'PATCH', signal: AbortSignal.timeout(35000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, lastMessageId }) });
  if (!response.ok) throw new Error('Unable to update message alerts.');
  window.dispatchEvent(new Event('chat-alerts-changed'));
}
export function useChatNotifications(token: string) {
  const [items, setItems] = useState<ChatAlert[]>([]);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    setItems([]); setError(''); setSessionExpired(false);
    if (isChatTokenExpired(token)) {
      setSessionExpired(true);
      setError('Your messaging session expired. Please sign in again.');
      return;
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let busy = false;
    let unauthorized = false;
    const load = async () => {
      if (busy || unauthorized || controller.signal.aborted) return;
      clearTimeout(timer);
      if (isChatTokenExpired(token)) {
        unauthorized = true; setItems([]); setSessionExpired(true);
        setError('Your messaging session expired. Please sign in again.');
        return;
      }
      busy = true;
      try {
        const response = await fetch(API, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]) });
        if (response.status === 401) {
          unauthorized = true;
          if (!controller.signal.aborted) {
            setItems([]); setSessionExpired(true);
            setError('Your messaging session expired. Please sign in again.');
          }
          return;
        }
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Message alerts unavailable.');
        if (!controller.signal.aborted) { setItems(data.notifications || []); setError(''); }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Message alerts unavailable.'); }
      finally { busy = false; if (!controller.signal.aborted && !unauthorized) timer = setTimeout(load, 10000); }
    };
    void load();
    window.addEventListener('chat-alerts-changed', load);
    window.addEventListener('focus', load);
    return () => { controller.abort(); clearTimeout(timer); window.removeEventListener('chat-alerts-changed', load); window.removeEventListener('focus', load); };
  }, [token]);
  return { items, count: items.reduce((total, item) => total + item.unreadCount, 0), error, sessionExpired };
}
