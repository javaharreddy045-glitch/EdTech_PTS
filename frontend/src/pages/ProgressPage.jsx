import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi } from '../api/endpoints.js';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { Button } from '../components/Button.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ActivityRow } from '../components/ActivityRow.jsx';

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-xs text-charcoal-soft">{label}</p>
      <p className="mt-1.5 font-display text-3xl text-charcoal">{value}</p>
    </div>
  );
}

export function ProgressPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    progressApi
      .mine()
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load your progress.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <EmptyState title="Couldn't load your progress" description={error || 'Please try refreshing the page.'} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-2xl text-charcoal sm:text-3xl">Your Progress</h1>
        <p className="mt-1.5 text-sm text-charcoal-soft">A snapshot of everything you've learned so far.</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Courses completed" value={data.coursesCompleted} />
        <StatTile label="Projects completed" value={data.projectsCompleted} />
        <StatTile label="Skills gained" value={data.skillsGained} />
        <StatTile label="Learning hours" value={data.learningHours} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-xs text-charcoal-soft">Learning streak</p>
        <p className="mt-1.5 font-display text-3xl text-charcoal">{data.learningStreakDays} day{data.learningStreakDays !== 1 ? 's' : ''}</p>
        <p className="mt-1 text-xs text-charcoal-soft">Consecutive days with completed activity.</p>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg text-charcoal">Your Learning Paths</h2>
          {data.activePaths.length > 0 && (
            <p className="text-sm text-charcoal-soft">Overall: <span className="font-medium text-charcoal">{data.overallLearningProgress}%</span></p>
          )}
        </div>

        {data.activePaths.length === 0 ? (
          <div className="mt-4">
            <p className="text-sm text-charcoal-soft">No active journey yet.</p>
            <Button to="/journeys" size="sm" className="mt-3">Browse Journeys</Button>
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-5">
            {data.activePaths.map((path) => (
              <li key={path.id}>
                <div className="flex items-baseline justify-between">
                  <Link to={`/journeys/${path.slug}`} className="font-medium text-charcoal hover:text-accent-dark">{path.title}</Link>
                  <span className="text-sm text-charcoal-soft">{path.overallProgress}%</span>
                </div>
                <ProgressBar value={path.overallProgress} className="mt-2" />
                <p className="mt-1.5 text-xs text-charcoal-soft">{path.nextMilestone}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-charcoal">Recent Activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal-soft">No activity yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {data.recentActivity.map((activity, i) => (
              <ActivityRow key={i} activity={activity} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
