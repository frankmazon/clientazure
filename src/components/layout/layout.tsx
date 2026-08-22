import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaBell,
  FaCheckCircle,
  FaCommentDots,
  FaExclamationTriangle,
  FaFileAlt,
  FaUserPlus,
} from 'react-icons/fa';
import Sidebar from '@/components/sidebar';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  messageCount?: number;
  messageClients?: MessageClientItem[];
  onMessagesOpen?: () => void;
  onMessageClientClick?: (clientKey: string) => void;
}

export type MessageClientItem = {
  clientKey: string;
  clientName: string;
  uniqueId?: string;
  messageCount: number;
  latestMessageAt?: string;
}

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  type?: 'submission' | 'complete' | 'incomplete' | 'file';
  unread: boolean;
  clientId?: number;
  uniqueId?: string;
  clientName?: string;
  documentType?: string;
  source?: string;
  redirectTo?: string;
};

const LOGO_PATH = '/logo/logo.png';
// Notifications are browser-local, so clear the stale pre-backend-reset
// entries once for every browser after the data reset.
const NOTIFICATION_RESET_VERSION = '2026-08-22-backend-reset';

export default function DashboardLayout({
  title,
  subtitle,
  children,
  messageCount = 0,
  messageClients = [],
  onMessagesOpen,
  onMessageClientClick,
}: DashboardLayoutProps) {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (localStorage.getItem('notificationResetVersion') !== NOTIFICATION_RESET_VERSION) {
      localStorage.removeItem('notifications');
      localStorage.setItem('notificationResetVersion', NOTIFICATION_RESET_VERSION);
    }

    const loadNotifications = () => {
      let savedNotifications: NotificationItem[] = [];
      try {
        savedNotifications = JSON.parse(
          localStorage.getItem('notifications') || '[]',
        );
      } catch {
        localStorage.removeItem('notifications');
      }
      setNotifications(savedNotifications);
    };

    loadNotifications();
    window.addEventListener('storage', loadNotifications);

    return () => {
      window.removeEventListener('storage', loadNotifications);
    };
  }, []);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'submission':
        return <FaUserPlus />;
      case 'file':
        return <FaFileAlt />;
      case 'complete':
        return <FaCheckCircle />;
      case 'incomplete':
        return <FaExclamationTriangle />;
      default:
        return <FaBell />;
    }
  };

  const getNotificationIconStyle = (type?: string) => {
    switch (type) {
      case 'complete':
        return 'bg-[#6CBF51]/15 text-[#6CBF51]';
      case 'incomplete':
        return 'bg-[#EE6521]/15 text-[#EE6521]';
      case 'submission':
        return 'bg-[#219688]/15 text-[#219688]';
      case 'file':
        return 'bg-[#EE6521]/15 text-[#EE6521]';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getNotificationBadge = (type?: string) => {
    switch (type) {
      case 'complete':
        return 'bg-[#6CBF51]/15 text-[#4f9a39]';
      case 'incomplete':
        return 'bg-[#EE6521]/15 text-[#c74f16]';
      case 'submission':
        return 'bg-[#219688]/15 text-[#176d63]';
      case 'file':
        return 'bg-[#EE6521]/15 text-[#c74f16]';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getNotificationLabel = (type?: string) => {
    switch (type) {
      case 'complete':
        return 'COMPLETE';
      case 'incomplete':
        return 'INCOMPLETE';
      case 'submission':
        return 'SUBMISSION';
      case 'file':
        return 'FILE';
      default:
        return 'NOTICE';
    }
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map((item) => ({
      ...item,
      unread: false,
    }));

    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const getNotificationRedirect = (item: NotificationItem) => {
    if (item.redirectTo) return item.redirectTo;
    if (item.type === 'incomplete') return '/dashboard';
    if (item.type === 'complete') return '/dashboard/clients';

    if (item.source === 'Client Portal' || item.type === 'file') {
      return '/dashboard/client-portal-uploads';
    }

    if (item.documentType) return `/dashboard/documents/${item.documentType}`;

    return '/dashboard/clients';
  };

  const handleNotificationClick = (item: NotificationItem) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === item.id
        ? { ...notification, unread: false }
        : notification,
    );

    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

    setShowNotifications(false);
    navigate(getNotificationRedirect(item));
  };

  return (
    <div className="min-h-screen bg-[#f6faf9]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDesktopHidden={isSidebarHidden}
        onDesktopClose={() => setIsSidebarHidden((hidden) => !hidden)}
      />

      <div
        className={`transition-[padding] duration-300 ${
          isSidebarHidden ? 'lg:pl-0' : 'lg:pl-96'
        }`}
      >
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-[#219688]/15 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl border border-[#219688]/20 bg-white p-3 text-[#219688] shadow-sm transition hover:bg-[#219688]/10 lg:hidden"
              aria-label="Open sidebar"
            >
              <FaBars />
            </button>

            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-[#219688]/15">
                <img
                  src={LOGO_PATH}
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {title}
                </h1>

                {subtitle && (
                  <p className="hidden truncate text-sm text-slate-500 sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-50 flex shrink-0 items-center gap-2">
            {onMessageClientClick && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowMessages((current) => {
                      const willOpen = !current;
                      if (willOpen) onMessagesOpen?.();
                      return willOpen;
                    });
                    setShowNotifications(false);
                  }}
                  className={`relative rounded-xl border bg-white p-3 text-[#219688] transition hover:bg-[#219688]/10 ${
                    messageCount > 0
                      ? 'animate-pulse border-[#EE6521]/60 shadow-[0_0_0_4px_rgba(238,101,33,0.13),0_0_24px_rgba(238,101,33,0.35)]'
                      : 'border-[#219688]/20 shadow-sm'
                  }`}
                  aria-label={`View client messages${
                    messageCount > 0 ? ` (${messageCount})` : ''
                  }`}
                  aria-expanded={showMessages}
                  title="View client messages"
                >
                  <FaCommentDots className="text-lg" />

                  {messageCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EE6521] px-1 text-[10px] font-bold text-white">
                      {messageCount > 99 ? '99+' : messageCount}
                    </span>
                  )}
                </button>

                {showMessages && (
                  <div className="absolute right-0 top-full z-[9999] mt-3 w-[330px] overflow-hidden rounded-2xl border border-[#219688]/15 bg-white shadow-2xl sm:w-96">
                    <div className="border-b border-[#219688]/10 px-5 py-4">
                      <h3 className="font-bold text-slate-900">
                        Client Messages
                      </h3>
                      <p className="text-xs text-slate-500">
                        {messageClients.length}{' '}
                        {messageClients.length === 1 ? 'client has' : 'clients have'} messages
                      </p>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {messageClients.length > 0 ? (
                        messageClients.map((item) => (
                          <button
                            type="button"
                            key={item.clientKey}
                            onClick={() => {
                              setShowMessages(false);
                              onMessageClientClick(item.clientKey);
                            }}
                            className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-[#219688]/5"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#219688]/10 text-[#219688]">
                              <FaCommentDots />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-slate-900">
                                {item.clientName}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-slate-500">
                                {item.uniqueId || 'Client'}
                                {item.latestMessageAt
                                  ? ` · ${item.latestMessageAt}`
                                  : ''}
                              </span>
                            </span>

                            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#EE6521] px-2 py-1 text-[10px] font-black text-white">
                              {item.messageCount > 99
                                ? '99+'
                                : item.messageCount}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-10 text-center">
                          <FaCommentDots className="mx-auto mb-3 text-2xl text-[#219688]/40" />
                          <p className="text-sm font-semibold text-slate-700">
                            No client messages yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowMessages(false);
                }}
                className="relative rounded-xl border border-[#219688]/20 bg-white p-3 text-[#219688] shadow-sm transition hover:bg-[#219688]/10"
                aria-label="Open notifications"
              >
                <FaBell className="text-lg" />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EE6521] px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full z-[9999] mt-3 w-[330px] overflow-hidden rounded-2xl border border-[#219688]/15 bg-white shadow-2xl sm:w-96">
                <div className="flex items-center justify-between border-b border-[#219688]/10 px-5 py-4">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Notifications
                    </h3>
                    <p className="text-xs text-slate-500">
                      {unreadCount} unread notification
                      {unreadCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="rounded-full bg-[#EE6521]/15 px-3 py-1 text-xs font-bold text-[#c74f16] hover:bg-[#EE6521]/25"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className="flex w-full gap-4 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-[#219688]/5"
                      >
                        <div
                          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getNotificationIconStyle(
                            item.type,
                          )}`}
                        >
                          {getNotificationIcon(item.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900">
                                  {item.title}
                                </p>

                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${getNotificationBadge(
                                    item.type,
                                  )}`}
                                >
                                  {getNotificationLabel(item.type)}
                                </span>
                              </div>

                              {item.clientName && (
                                <p className="mt-1 text-xs font-semibold text-slate-700">
                                  {item.clientName}
                                </p>
                              )}

                              {item.uniqueId && (
                                <p className="text-xs text-slate-400">
                                  {item.uniqueId}
                                </p>
                              )}
                            </div>

                            {item.unread && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#EE6521]" />
                            )}
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {item.message}
                          </p>

                          <p className="mt-2 text-xs font-medium text-slate-400">
                            {item.time}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <FaBell className="mx-auto mb-3 text-2xl text-[#219688]/40" />
                      <p className="text-sm font-semibold text-slate-700">
                        No notifications yet
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        New submissions will appear here.
                      </p>
                    </div>
                  )}
                </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
