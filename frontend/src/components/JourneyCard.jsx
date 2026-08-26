import { Button } from './Button.jsx';
import { getJourneyImage } from '../utils/journeyImages.js';

export function JourneyCard({ journey }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-charcoal/5">
      <div className="aspect-[16/9] w-full overflow-hidden bg-cream-dim">
        <img src={getJourneyImage(journey.goal_slug)} alt={journey.goal_title} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">{journey.goal_title}</p>
          <h3 className="mt-1 font-display text-lg font-medium text-charcoal">{journey.title}</h3>
        </div>

        <p className="text-sm text-charcoal-soft">
          Courses: {journey.courseCount} · Projects: {journey.projectCount} · Time: {journey.duration_weeks} weeks
        </p>

        {journey.isFollowing && <p className="text-sm font-medium text-accent-dark">Following ✓</p>}

        <Button to={`/journeys/${journey.slug}`} size="sm" className="mt-auto self-start">
          View Journey →
        </Button>
      </div>
    </div>
  );
}
