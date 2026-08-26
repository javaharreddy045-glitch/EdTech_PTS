import { useEffect, useState } from 'react';
import { learningPathApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { JourneyCard } from '../components/JourneyCard.jsx';
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

  const cardJourneys = paths.map((p) => ({
    ...p.journey,
    totalCourses: p.totalCourses,
    completedCourses: p.completedCourses,
    overallProgress: p.overallProgress,
    nextStep: p.nextStep,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">My Learning Paths</p>
      <h1 className="mt-1 font-display text-2xl text-charcoal sm:text-3xl">
        {cardJourneys.length === 1 ? 'Your Learning Path' : `You're following ${cardJourneys.length} journeys`}
      </h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        Following a new journey never removes an old one — track and continue as many as you like.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cardJourneys.map((journey) => (
          <JourneyCard key={journey.id} journey={journey} />
        ))}
      </div>

      <div className="mt-8">
        <Button to="/journeys" variant="secondary">+ Explore Learning Paths</Button>
      </div>
    </div>
  );
}
