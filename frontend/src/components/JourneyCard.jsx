import { Link } from 'react-router-dom';

const MAX_CHAIN_STEPS = 4;

export function JourneyCard({ journey }) {
  const chain = journey.stepChain || [];
  const visibleChain = chain.slice(0, MAX_CHAIN_STEPS);
  const hasMore = chain.length > MAX_CHAIN_STEPS;

  return (
    <Link
      to={`/journeys/${journey.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">{journey.goal_title}</p>
        <h3 className="mt-1 font-display text-lg font-medium text-charcoal">{journey.title}</h3>
      </div>

      {visibleChain.length > 0 && (
        <p className="text-sm text-charcoal-soft">
          {visibleChain.join(' → ')}
          {hasMore && ' → …'}
        </p>
      )}

      <p className="text-sm text-charcoal-soft">
        {journey.courseCount} courses · {journey.projectCount} projects · {journey.duration_weeks} weeks
      </p>

      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark">
        View Journey
        <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
