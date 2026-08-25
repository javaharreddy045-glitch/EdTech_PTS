export function SkillPill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-cream-dim text-charcoal-soft border-border',
    accent: 'bg-accent-soft text-accent-dark border-accent-soft',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
