import { Link } from 'react-router-dom';
import { Button } from './Button.jsx';

export function JourneyCard({ journey }) {
  const chain = journey.stepChain || [];
  const startingSkills = journey.startingSkills || [];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-charcoal/5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">{journey.goal_title}</p>
        <h3 className="mt-1 font-display text-lg font-medium text-charcoal">{journey.title}</h3>
      </div>

      {startingSkills.length > 0 && (
        <p className="text-sm text-charcoal-soft">
          <span className="text-charcoal">Started with:</span> {startingSkills.join(', ')}
        </p>
      )}

      <p className="text-sm text-charcoal-soft">
        {journey.courseCount} courses · {journey.projectCount} projects · {journey.duration_weeks} weeks
      </p>

      {chain.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-charcoal-soft" aria-label="Journey sequence">
          {chain.map((step, i) => (
            <span key={step} className="flex items-center gap-1.5">
              <span className="rounded-full bg-cream-dim px-2.5 py-1 text-xs text-charcoal">{step}</span>
              {i < chain.length - 1 && <span aria-hidden="true">→</span>}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-charcoal-soft">Outcome: <span className="text-charcoal">{journey.outcome}</span></p>
        <Button to={`/journeys/${journey.slug}`} size="sm" variant="secondary">
          View Journey
        </Button>
      </div>
    </div>
  );
}
