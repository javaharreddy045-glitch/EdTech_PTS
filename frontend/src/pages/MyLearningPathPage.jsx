import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningPathApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

const STATUS_STYLE = {
  completed: 'border-accent bg-accent text-white',
  active: 'border-accent bg-white text-accent-dark',
  in_progress: 'border-accent bg-white text-accent-dark',
  not_started: 'border-border bg-white text-charcoal-soft',
};

function JourneyPathCard({ path, onSkip, skippingId }) {
  const { journey, steps, overallProgress, nextStep } = path;

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">Following since {new Date(journey.started_at).toLocaleDateString()}</p>
      <h2 className="mt-1 font-display text-xl text-charcoal">{journey.title}</h2>
      <p className="mt-1 text-sm text-charcoal-soft">Outcome: {journey.outcome}</p>

      <ProgressBar value={overallProgress} label="Path progress" className="mt-5" />

      {nextStep && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-accent bg-accent-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-accent-dark">Next recommended step</p>
            <p className="font-medium text-charcoal">{nextStep.title}</p>
          </div>
          <Button to={nextStep.type === 'course' ? `/courses/${nextStep.slug}` : `/projects/${nextStep.slug}`} size="sm">
            Continue Learning
          </Button>
        </div>
      )}

      <ol className="mt-6 flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={`${step.type}-${step.id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium ${STATUS_STYLE[step.status] || STATUS_STYLE.not_started}`}
              aria-hidden="true"
            >
              {step.status === 'completed' ? '✓' : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-charcoal">{step.title}</p>
              <p className="text-xs capitalize text-charcoal-soft">{step.type} · {step.status.replace('_', ' ')}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {step.status !== 'completed' && step.type === 'course' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSkip(step.id)}
                  disabled={skippingId === step.id}
                >
                  {skippingId === step.id ? 'Skipping...' : 'I know this'}
                </Button>
              )}
              <Link
                to={step.type === 'course' ? `/courses/${step.slug}` : `/projects/${step.slug}`}
                className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-charcoal transition-colors hover:border-accent hover:text-accent-dark"
              >
                {step.status === 'completed' ? 'Review' : 'Open'}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MyLearningPathPage() {
  const [paths, setPaths] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skippingId, setSkippingId] = useState(null);

  function load() {
    setIsLoading(true);
    learningPathApi
      .mine()
      .then((data) => setPaths(data.paths))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleSkip(courseId) {
    setSkippingId(courseId);
    try {
      await learningPathApi.skip(courseId);
      load();
    } finally {
      setSkippingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  if (!paths || paths.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          title="You haven't followed a journey yet"
          description="Browse learning journeys from people who started where you are and follow one to build your personalized path."
          action={<Button to="/journeys">Browse Journeys</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">My Learning Paths</p>
      <h1 className="mt-1 font-display text-2xl text-charcoal sm:text-3xl">
        {paths.length === 1 ? 'Your Learning Path' : `You're following ${paths.length} journeys`}
      </h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        Following a new journey never removes an old one — track and continue as many as you like.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {paths.map((path) => (
          <JourneyPathCard key={path.journey.id} path={path} onSkip={handleSkip} skippingId={skippingId} />
        ))}
      </div>

      <div className="mt-8">
        <Button to="/journeys" variant="secondary">+ Explore Learning Paths</Button>
      </div>
    </div>
  );
}
