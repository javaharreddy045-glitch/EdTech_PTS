import { useNotifications } from '../context/NotificationsContext.jsx';
import { Button } from '../components/Button.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const units = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-charcoal sm:text-3xl">Notifications</h1>
          <p className="mt-1.5 text-sm text-charcoal-soft">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </header>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications yet" description="We'll let you know about milestones, recommendations, and completions here." />
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                    n.is_read ? 'border-border bg-white' : 'border-accent/40 bg-accent-soft/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-charcoal">{n.title}</span>
                    <span className="text-xs text-charcoal-soft">{timeAgo(n.created_at)}</span>
                  </div>
                  <span className="text-sm text-charcoal-soft">{n.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
