export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/40 px-6 py-14 text-center">
      <h3 className="font-display text-lg text-charcoal">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-charcoal-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
