import { Button } from './Button.jsx';
import { ProgressBar } from './ProgressBar.jsx';

export function LearningPathCard({ journey }) {
  const nextLine = journey.nextStep
    ? journey.nextStep.status === 'active'
      ? `In progress: ${journey.nextStep.title}`
      : `Next: ${journey.nextStep.title}`
    : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Learning Path</p>
        <p className="mt-1 font-medium text-charcoal">{journey.title}</p>
        {journey.description && <p className="mt-1 line-clamp-1 text-sm text-charcoal-soft">{journey.description}</p>}
        <p className="mt-2 text-sm text-charcoal-soft">{journey.completedCourses} / {journey.totalCourses} courses completed</p>
        {nextLine && <p className="mt-0.5 text-sm text-charcoal-soft">{nextLine}</p>}
        <ProgressBar value={journey.overallProgress} className="mt-2 max-w-xs" />
      </div>
      <Button to={`/journeys/${journey.slug}`} className="shrink-0">Explore Path →</Button>
    </div>
  );
}
