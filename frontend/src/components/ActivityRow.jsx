const KIND_META = {
  lesson_completed: { icon: '✓', label: 'Completed lesson', className: 'bg-accent text-white' },
  lesson: { icon: '✓', label: 'Completed lesson', className: 'bg-accent text-white' },
  project_completed: { icon: '★', label: 'Completed project', className: 'bg-warn text-white' },
  project: { icon: '★', label: 'Completed project', className: 'bg-warn text-white' },
  assessment_taken: { icon: '◉', label: 'Took assessment', className: 'bg-accent-blue text-white' },
  assessment: { icon: '◉', label: 'Took assessment', className: 'bg-accent-blue text-white' },
};

function timeAgo(dateString) {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const units = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function ActivityRow({ activity }) {
  const meta = KIND_META[activity.kind] || { icon: '•', label: 'Activity', className: 'bg-cream-dim text-charcoal-soft' };
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${meta.className}`} aria-hidden="true">
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-charcoal">
          {meta.label}: <span className="font-medium">{activity.label}</span>
        </p>
        {activity.context && <p className="truncate text-xs text-charcoal-soft">{activity.context}</p>}
      </div>
      <span className="shrink-0 text-xs text-charcoal-soft">{timeAgo(activity.occurred_at)}</span>
    </li>
  );
}
