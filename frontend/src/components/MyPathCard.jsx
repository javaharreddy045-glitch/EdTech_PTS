import { Link } from 'react-router-dom';
import { ProgressBar } from './ProgressBar.jsx';

export function MyPathCard({ path }) {
  const nextLine = path.nextStep
    ? path.nextStep.status === 'active'
      ? `In progress: ${path.nextStep.title}`
      : `Next: ${path.nextStep.title}`
    : null;
  const ctaLabel = path.completedCourses > 0 ? 'View Path' : 'Explore Path';

  return (
    <Link
      to={`/journeys/${path.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Learning Path</p>
        <h3 className="mt-1 font-display text-lg text-charcoal">{path.title}</h3>
      </div>

      {path.description && <p className="line-clamp-2 text-sm leading-relaxed text-charcoal-soft">{path.description}</p>}

      <div>
        <p className="text-xs text-charcoal-soft">{path.completedCourses} / {path.totalCourses} courses completed</p>
        <ProgressBar value={path.overallProgress} className="mt-2" />
      </div>

      {nextLine && <p className="text-sm text-charcoal">{nextLine}</p>}

      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark">
        {ctaLabel}
        <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
