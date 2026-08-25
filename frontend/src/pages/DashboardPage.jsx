import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { JourneyCard } from '../components/JourneyCard.jsx';
import { CardSkeletonGrid, Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

function timeAgo(dateString) {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const units = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .mine()
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load your dashboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <div className="mt-8">
          <CardSkeletonGrid count={3} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <EmptyState title="Couldn't load your dashboard" description={error || 'Please try refreshing the page.'} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-2xl text-charcoal sm:text-3xl">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-charcoal-soft">
          Goal: <span className="text-charcoal">{data.goal || 'Not set'}</span> · Level:{' '}
          <span className="capitalize text-charcoal">{data.currentLevel || 'Not set'}</span>
        </p>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-charcoal">
              {data.currentJourney ? data.currentJourney.title : 'No active journey yet'}
            </h2>
            {data.currentJourney && (
              <Button to="/learning-path" size="sm" variant="secondary">
                Continue Learning
              </Button>
            )}
          </div>
          {data.currentJourney ? (
            <>
              <ProgressBar value={data.overallProgress} label="Overall progress" className="mt-4" />
              <p className="mt-3 text-sm text-charcoal-soft">
                {data.currentJourney.completed_courses} of {data.currentJourney.total_courses} courses completed
              </p>
              {data.continueLearning && (
                <div className="mt-4 rounded-xl bg-cream-dim/60 p-3">
                  <p className="text-xs text-charcoal-soft">Pick up where you left off</p>
                  <Link to={`/courses/${data.continueLearning.slug}`} className="font-medium text-charcoal hover:text-accent-dark">
                    {data.continueLearning.title}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="Start your first journey"
              description="Browse learning journeys from people who started where you are now."
              action={<Button to="/journeys">Browse Journeys</Button>}
            />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display text-lg text-charcoal">Upcoming Milestone</h2>
          <p className="mt-3 text-sm text-charcoal-soft">
            {data.upcomingMilestone || 'Complete onboarding steps to see your next milestone.'}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-charcoal-soft">Courses completed</dt>
              <dd className="font-display text-xl text-charcoal">{data.stats.completed_courses}</dd>
            </div>
            <div>
              <dt className="text-charcoal-soft">Projects completed</dt>
              <dd className="font-display text-xl text-charcoal">{data.stats.completed_projects}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal">Learners with a similar starting point followed these paths</h2>
        <p className="mt-1 text-sm text-charcoal-soft">The core idea behind PathToSkill: don't guess what to learn next — see what worked.</p>
        {data.similarJourneys.length === 0 ? (
          <EmptyState title="No matching journeys yet" description="Complete onboarding to get personalized journey matches." />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {data.similarJourneys.map((journey) => (
              <JourneyCard key={journey.id} journey={{ ...journey, courseCount: journey.course_count, projectCount: journey.project_count }} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-charcoal">Recommended Courses</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {data.recommendedCourses.map((course) => (
              <li key={course.id}>
                <Link
                  to={`/courses/${course.slug}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-white p-3.5 transition-colors hover:border-accent"
                >
                  <div>
                    <p className="font-medium text-charcoal">{course.title}</p>
                    <p className="text-xs capitalize text-charcoal-soft">{course.difficulty} · {Number(course.duration_hours)} hrs</p>
                  </div>
                  <span aria-hidden="true" className="text-charcoal-soft">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-xl text-charcoal">Recommended Projects</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {data.recommendedProjects.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/projects/${project.slug}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-white p-3.5 transition-colors hover:border-accent"
                >
                  <div>
                    <p className="font-medium text-charcoal">{project.title}</p>
                    <p className="text-xs capitalize text-charcoal-soft">{project.difficulty} · {Number(project.estimated_hours)} hrs</p>
                  </div>
                  <span aria-hidden="true" className="text-charcoal-soft">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal">Recent Activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal-soft">Nothing yet — complete a lesson or project to see it here.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {data.recentActivity.map((activity, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm">
                <span className="text-charcoal">
                  {activity.kind === 'lesson_completed' ? 'Completed lesson: ' : 'Completed project: '}
                  <span className="font-medium">{activity.label}</span>
                </span>
                <span className="text-xs text-charcoal-soft">{timeAgo(activity.occurred_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
