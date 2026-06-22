import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaBell,
  FaCheckCircle,
  FaFileAlt,
  FaUserPlus,
} from 'react-icons/fa';
import Sidebar from '@/components/sidebar';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  type?: string;
  unread: boolean;
  clientId?: number;
  documentType?: string;
  source?: string;
  redirectTo?: string;
};

export default function DashboardLayout({
  title,
  subtitle,
  children,
}: DashboardLayoutProps) {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const savedNotifications = JSON.parse(
      localStorage.getItem('notifications') || '[]',
    );

    setNotifications(savedNotifications);
  }, []);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const getNotificationIcon = (type?: string) => {
    if (type === 'submission') return <FaUserPlus />;
    if (type === 'file') return <FaFileAlt />;
    return <FaCheckCircle />;
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

    if (item.source === 'Client Portal' || item.type === 'file') {
      return '/dashboard/client-portal-uploads';
    }

    if (item.documentType) {
      return `/dashboard/documents/${item.documentType}`;
    }

    return '/dashboard/clients';
  };

  const handleNotificationClick = (item: NotificationItem) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === item.id
        ? {
            ...notification,
            unread: false,
          }
        : notification,
    );

    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

    setShowNotifications(false);
    navigate(getNotificationRedirect(item));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-3 text-slate-700 lg:hidden"
              aria-label="Open sidebar"
            >
              <FaBars />
            </button>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                {title}
              </h1>

              {subtitle && (
                <p className="hidden text-sm text-slate-500 sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="relative z-50">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative rounded-xl border border-slate-200 p-3 text-slate-700 transition hover:bg-slate-50"
              aria-label="Open notifications"
            >
              <FaBell className="text-lg" />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full z-[9999] mt-3 w-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Notifications
                    </h3>
                    <p className="text-xs text-slate-500">
                      {unreadCount} unread notification
                      {unreadCount > 1 ? 's' : ''}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-200"
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
                        className="flex w-full gap-4 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                          {getNotificationIcon(item.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-slate-900">
                              {item.title}
                            </p>

                            {item.unread && (
                              <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
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
                      <FaBell className="mx-auto mb-3 text-2xl text-slate-300" />
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
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}