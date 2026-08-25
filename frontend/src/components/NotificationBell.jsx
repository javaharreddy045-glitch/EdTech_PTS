import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOnClickOutside } from '../hooks/useOnClickOutside.js';
import { useNotifications } from '../context/NotificationsContext.jsx';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const units = [
    ['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  useOnClickOutside(containerRef, () => setIsOpen(false));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        className="relative rounded-full p-2 text-charcoal-soft transition-colors hover:bg-cream-dim hover:text-charcoal"
      >
        <span aria-hidden="true" className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="animate-fade-up absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display text-sm text-charcoal">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-medium text-accent-dark hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-charcoal-soft">You're all caught up.</p>
            )}
            <ul>
              {notifications.slice(0, 8).map((n) => (
                <li key={n.id} className={`border-b border-border last:border-0 ${n.is_read ? '' : 'bg-accent-soft/40'}`}>
                  <button
                    type="button"
                    onClick={() => !n.is_read && markRead(n.id)}
                    className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-cream-dim"
                  >
                    <span className="text-sm font-medium text-charcoal">{n.title}</span>
                    <span className="text-xs text-charcoal-soft">{n.message}</span>
                    <span className="text-[11px] text-charcoal-soft/80">{timeAgo(n.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-accent-dark hover:bg-cream-dim"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
