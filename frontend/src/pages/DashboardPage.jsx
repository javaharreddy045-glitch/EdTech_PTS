import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { JourneyCard } from '../components/JourneyCard.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
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

const ACTIVITY_LABELS = {
  lesson_completed: 'Completed lesson: ',
  project_completed: 'Completed project: ',
  assessment_taken: 'Took assessment: ',
};

function StatInline({ value, label }) {
  return (
    <div>
      <p className="font-display text-2xl text-charcoal">{value}</p>
      <p className="text-xs text-charcoal-soft">{label}</p>
    </div>
  );
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
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-10 h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <EmptyState title="Couldn't load your dashboard" description={error || 'Please try refreshing the page.'} />
      </div>
    );
  }

  const hasRecommendations = data.recommendedCourses.length > 0 || data.recommendedProjects.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl text-charcoal">Welcome back, {user?.name?.split(' ')[0]}</h1>
        {data.goal && (
          <p className="mt-2 text-base text-charcoal-soft">
            Your goal: <span className="text-charcoal">{data.goal}</span>
            {data.currentLevel && <span className="capitalize"> · {data.currentLevel}</span>}
          </p>
        )}
      </header>

      {data.activePaths.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          <StatInline value={`${data.overallLearningProgress}%`} label="Overall Progress" />
          <StatInline value={data.stats.completed_courses} label="Courses Completed" />
          <StatInline value={data.stats.completed_projects} label="Projects" />
          <StatInline value={data.stats.skills_gained} label="Skills Gained" />
        </div>
      )}

      {/* My Learning Paths — the dominant, primary section */}
      <section className="mt-12">
        <h2 className="font-display text-xl text-charcoal">
          {data.activePaths.length > 1 ? 'My Learning Paths' : 'My Learning Path'}
        </h2>

        {data.activePaths.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-lg text-charcoal">Choose a learning path to get started.</p>
            <p className="mt-2 text-sm text-charcoal-soft">See how learners with a similar starting point reached their goal.</p>
            <Button to="/journeys" className="mt-5">Explore Learning Paths</Button>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-border bg-white p-6 sm:p-8">
            <ul className="divide-y divide-border">
              {data.activePaths.map((path) => (
                <li key={path.id} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link to={`/journeys/${path.slug}`} className="font-display text-xl text-charcoal transition-colors hover:text-accent-dark">
                        {path.title}
                      </Link>
                      <p className="mt-1.5 text-sm text-charcoal-soft">
                        {path.overallProgress}% complete
                        {path.nextStep && <> · Next: {path.nextStep.title}</>}
                      </p>
                    </div>
                    {path.nextStep && (
                      <Button
                        to={path.nextStep.type === 'course' ? `/courses/${path.nextStep.slug}` : `/projects/${path.nextStep.slug}`}
                        size="sm"
                        className="shrink-0"
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                  <ProgressBar value={path.overallProgress} className="mt-4" />
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link to="/journeys" className="mt-4 inline-block text-sm font-medium text-accent-dark hover:underline">
          + Explore more learning paths
        </Link>
      </section>

      {/* Learners Like You — the core differentiator */}
      <section className="mt-14">
        <h2 className="font-display text-xl text-charcoal">Learners Like You</h2>
        <p className="mt-1.5 text-sm text-charcoal-soft">See learning paths followed by learners who started from a similar point.</p>

        {data.similarJourneys.length === 0 ? (
          <p className="mt-4 text-sm text-charcoal-soft">Complete onboarding to get personalized journey matches.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {data.similarJourneys.map((journey) => (
              <JourneyCard key={journey.id} journey={{ ...journey, courseCount: journey.course_count, projectCount: journey.project_count }} />
            ))}
          </div>
        )}
        <Link to="/journeys" className="mt-4 inline-block text-sm font-medium text-accent-dark hover:underline">
          View all journeys →
        </Link>
      </section>

      {/* Recommendations — compact, capped */}
      {hasRecommendations && (
        <section className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2">
          {data.recommendedCourses.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-charcoal">Recommended Courses</h2>
                <Link to="/courses" className="text-xs font-medium text-accent-dark hover:underline">View all</Link>
              </div>
              <ul className="mt-3 divide-y divide-border">
                {data.recommendedCourses.map((course) => (
                  <li key={course.slug} className="py-3">
                    <Link to={`/courses/${course.slug}`} className="font-medium text-charcoal transition-colors hover:text-accent-dark">
                      {course.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-charcoal-soft">
                      {course.journeyTitle ? `For your ${course.journeyTitle}` : 'Popular with learners'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.recommendedProjects.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-charcoal">Recommended Projects</h2>
                <Link to="/projects" className="text-xs font-medium text-accent-dark hover:underline">View all</Link>
              </div>
              <ul className="mt-3 divide-y divide-border">
                {data.recommendedProjects.map((project) => (
                  <li key={project.slug} className="py-3">
                    <Link to={`/projects/${project.slug}`} className="font-medium text-charcoal transition-colors hover:text-accent-dark">
                      {project.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-charcoal-soft">
                      {project.journeyTitle ? `For your ${project.journeyTitle}` : 'Popular with learners'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Recent Activity — compact rows */}
      <section className="mt-14">
        <h2 className="font-display text-lg text-charcoal">Recent Activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal-soft">Nothing yet — complete a lesson or project to see it here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.recentActivity.map((activity, i) => (
              <li key={i} className="flex items-center justify-between py-3 text-sm">
                <span className="text-charcoal">
                  {ACTIVITY_LABELS[activity.kind] || 'Activity: '}
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
