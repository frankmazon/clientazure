import { useEffect, useRef, useState } from 'react';
import { FaBell, FaCommentDots, FaMinus, FaTimes, FaKey, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import ChatDashboard from './ChatDashboard';
import { useChatNotifications } from './useChatNotifications';

type Props = { token: string; client: { id: number; name: string; uniqueId?: string }; open: boolean; onOpenChange: (open: boolean) => void; onChangePassword: () => void; onLogout: () => void };
export default function ClientMessenger({ token, client, open, onOpenChange, onChangePassword, onLogout }: Props) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const initials = client.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'C';
  const alerts = useChatNotifications(token);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setAccountOpen(false); setNotificationsOpen(false); onOpenChange(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onOpenChange]);
  const openChat = () => { setAccountOpen(false); onOpenChange(true); setNotificationsOpen(false); };
  const badge = alerts.count > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-orange-600 px-1 text-xs font-black text-white">{alerts.count > 99 ? '99+' : alerts.count}</span>;
  return <>
    {notificationsOpen && <section aria-label="Message notifications" className="fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-black">Notifications</h2><p className="text-xs text-slate-500">Updates from your SBR Funding team</p></div><button aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} className="p-2"><FaTimes /></button></div>
      {alerts.error ? <p role="alert" className="p-4 text-sm text-red-700">{alerts.error}</p> : alerts.count ? <button onClick={openChat} className="flex w-full gap-3 bg-teal-50 p-5 text-left hover:bg-teal-100"><FaCommentDots className="mt-1 text-xl text-teal-600" /><span><strong className="block">New message from your team</strong><span className="text-sm text-slate-600">{alerts.count} unread · Open conversation</span></span></button> : <div className="p-8 text-center"><FaBell className="mx-auto mb-3 text-2xl text-teal-500" /><p className="font-bold">You're all caught up</p><p className="mt-1 text-sm text-slate-500">Your team's replies will appear here.</p></div>}
    </section>}
    {<section aria-label="Chat with SBR Funding" className={`${open ? 'flex' : 'hidden'} fixed bottom-4 right-4 z-40 h-[min(580px,calc(100dvh-104px))] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.25)] sm:w-[380px]`}>
      <header className="chat-brand-header flex shrink-0 items-center gap-3 px-4 py-3 text-white"><span className="rounded-full bg-white/15 p-3"><FaCommentDots /></span><div className="flex-1"><h2 className="text-sm font-black">SBR Funding Team</h2><p className="text-xs text-teal-100">Your scenario conversation</p></div><button onClick={() => onOpenChange(false)} aria-label="Minimize chat" className="rounded-full p-2 hover:bg-white/15"><FaMinus /></button><button onClick={() => onOpenChange(false)} aria-label="Close chat" className="rounded-full p-2 hover:bg-white/15"><FaTimes /></button></header>
      <div className="min-h-0 flex-1"><ChatDashboard token={token} role="Client" client={client} compact active={open} /></div>
    </section>}
    <header aria-label="Client portal header" className="portal-topbar fixed inset-x-0 top-0 z-40 border-b border-teal-100">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="portal-brand min-w-0"><p className="text-sm font-black text-slate-900 sm:text-base">Client Portal</p><p className="text-xs text-slate-500">SBR Funding</p></div>
        </div>
        <nav aria-label="Client messages and notifications" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button title="Messages" aria-label={`Open client chat${alerts.count ? `, ${alerts.count} unread` : ''}`} aria-expanded={open} onClick={() => open ? onOpenChange(false) : openChat()} className={`relative flex h-11 w-11 items-center justify-center rounded-full text-xl transition ${open ? 'bg-teal-600 text-white' : 'bg-slate-100 text-teal-700 hover:bg-teal-100'}`}><FaCommentDots />{badge}</button>
          <button title="Notifications" aria-label={`Client notifications${alerts.count ? `, ${alerts.count} unread` : ''}`} aria-expanded={notificationsOpen} onClick={() => { setAccountOpen(false); setNotificationsOpen(v => !v); }} className={`relative flex h-11 w-11 items-center justify-center rounded-full text-xl transition ${notificationsOpen ? 'bg-teal-600 text-white' : 'bg-slate-100 text-teal-700 hover:bg-teal-100'}`}><FaBell />{badge}</button>
          <div className="relative ml-1 border-l border-slate-200 pl-3" ref={accountRef}>
            <button aria-label="Account settings" aria-expanded={accountOpen} aria-controls="client-account-panel" onClick={() => { setAccountOpen(v => !v); setNotificationsOpen(false); }} className="flex items-center gap-2 rounded-full p-1 text-slate-700 hover:bg-slate-100 focus-visible:outline-teal-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white">{initials}</span>
              <span className="hidden max-w-36 truncate text-sm font-bold lg:block">{client.name}</span>
              <FaChevronDown className="hidden text-xs sm:block" />
            </button>
            {accountOpen && <div id="client-account-panel" className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl">
              <div className="border-b border-slate-100 px-4 py-4"><p className="break-words text-sm font-bold">{client.name}</p><p className="mt-1 text-xs text-slate-500">{client.uniqueId}</p></div>
              <div className="p-2">
                <button onClick={() => { setAccountOpen(false); onChangePassword(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-teal-50"><FaKey className="text-teal-600" />Change Password</button>
                <button onClick={() => { setAccountOpen(false); onLogout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><FaSignOutAlt />Logout</button>
              </div>
            </div>}
          </div>
        </nav>
      </div>
    </header>
  </>;
}
