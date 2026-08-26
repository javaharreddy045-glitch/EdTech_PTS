import { Button } from './Button.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { getJourneyImage } from '../utils/journeyImages.js';

export function JourneyCard({ journey }) {
  const hasProgress = journey.overallProgress !== undefined;
  const nextLine = journey.nextStep
    ? journey.nextStep.status === 'active'
      ? `In progress: ${journey.nextStep.title}`
      : `Next: ${journey.nextStep.title}`
    : null;

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

        {hasProgress ? (
          <div>
            <p className="text-xs text-charcoal-soft">{journey.completedCourses} / {journey.totalCourses} courses completed</p>
            <ProgressBar value={journey.overallProgress} className="mt-2" />
          </div>
        ) : (
          journey.isFollowing && <p className="text-sm font-medium text-accent-dark">Following ✓</p>
        )}

        {nextLine && <p className="text-sm text-charcoal">{nextLine}</p>}

        <Button to={`/journeys/${journey.slug}`} size="sm" className="mt-auto self-start">
          {hasProgress ? 'Continue Learning →' : 'View Journey →'}
        </Button>
      </div>
    </div>
  );
}
