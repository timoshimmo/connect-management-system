import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { useAppSelector } from '@/hooks';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './hooks';
import { getNotificationMeta, formatRelativeTime } from './notificationMeta';
import type { ApiNotification } from '@/lib/apiTypes';

/**
 * App-wide notification bell — mounted once in ProtectedLayout so every
 * authenticated page gets it for free. Polls via useNotificationsQuery
 * today; see that hook's comment for how this swaps to real-time later
 * without any change here.
 */
export function NotificationBell() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data } = useNotificationsQuery(isAuthenticated);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleSelect(notification: ApiNotification) {
    if (!notification.read) markRead.mutate(notification._id);
    setOpen(false);
    if (notification.relatedDocument) {
      navigate(`/ms-publishing?doc=${notification.relatedDocument}`);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.12 } }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg sm:w-96"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-400">
                    You're all caught up — no notifications yet.
                  </div>
                ) : (
                  <ul>
                    {items.map((notification) => {
                      const meta = getNotificationMeta(notification.type);
                      const Icon = meta.icon;
                      return (
                        <li key={notification._id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(notification)}
                            className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                              notification.read ? '' : 'bg-brand-50/40'
                            }`}
                          >
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconClasses}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-gray-900">{meta.title}</span>
                                {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                              </span>
                              <span className="mt-0.5 block text-xs leading-snug text-gray-600">{notification.message}</span>
                              <span className="mt-0.5 block text-[11px] text-gray-400">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
