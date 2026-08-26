import { Button } from './Button.jsx';
import { ProgressBar } from './ProgressBar.jsx';

export function LearningPathCard({ journey }) {
  const nextLine = journey.nextStep
    ? journey.nextStep.status === 'active'
      ? `In progress: ${journey.nextStep.title}`
      : `Next: ${journey.nextStep.title}`
    : null;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 transition-all duration-200 ease-out hover:border-accent/40 hover:shadow-lg hover:shadow-charcoal/5 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="lg:w-[34%]">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Learning Path</p>
          <h3 className="mt-1.5 font-display text-xl text-charcoal">{journey.title}</h3>
          {journey.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-charcoal-soft">{journey.description}</p>
          )}
        </div>

        <div className="flex-1 lg:border-x lg:border-border lg:px-10">
          <p className="text-xs text-charcoal-soft">{journey.completedCourses} / {journey.totalCourses} courses completed</p>
          <ProgressBar value={journey.overallProgress} className="mt-2 max-w-sm" />
          {nextLine && <p className="mt-3 text-sm text-charcoal">{nextLine}</p>}
        </div>

        <div className="lg:w-auto lg:flex-shrink-0">
          <Button to={`/journeys/${journey.slug}`} size="lg" className="w-full lg:w-auto">
            Explore Path →
          </Button>
        </div>
      </div>
    </div>
  );
}
