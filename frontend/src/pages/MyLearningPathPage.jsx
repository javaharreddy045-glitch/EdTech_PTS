import { useEffect, useState } from 'react';
import { learningPathApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { MyPathCard } from '../components/MyPathCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

export function MyLearningPathPage() {
  const [paths, setPaths] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    learningPathApi.mine().then((data) => setPaths(data.paths)).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  if (!paths || paths.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <EmptyState
          title="You haven't followed a journey yet"
          description="Browse learning journeys from people who started where you are and follow one to build your personalized path."
          action={<Button to="/journeys">Browse Journeys</Button>}
        />
      </div>
    );
  }

  const cardPaths = paths.map((p) => ({
    id: p.journey.id,
    title: p.journey.title,
    slug: p.journey.slug,
    description: p.journey.description,
    outcome: p.journey.outcome,
    totalCourses: p.totalCourses,
    completedCourses: p.completedCourses,
    overallProgress: p.overallProgress,
    nextStep: p.nextStep,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">My Learning Paths</p>
      <h1 className="mt-1 font-display text-2xl text-charcoal sm:text-3xl">
        {cardPaths.length === 1 ? 'Your Learning Path' : `You're following ${cardPaths.length} journeys`}
      </h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        Following a new journey never removes an old one — track and continue as many as you like.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {cardPaths.map((path) => (
          <MyPathCard key={path.id} path={path} />
        ))}
      </div>

      <div className="mt-8">
        <Button to="/journeys" variant="secondary">+ Explore Learning Paths</Button>
      </div>
    </div>
  );
}
