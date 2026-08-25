import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, learnersApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { MyPathCard } from '../components/MyPathCard.jsx';
import { LearnerCard } from '../components/LearnerCard.jsx';
import { CourseCard } from '../components/CourseCard.jsx';
import { ProjectCard } from '../components/ProjectCard.jsx';
import { ActivityRow } from '../components/ActivityRow.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

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
  const [learners, setLearners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([dashboardApi.mine(), learnersApi.similar().catch(() => ({ learners: [] }))])
      .then(([dashboard, learnersData]) => {
        setData(dashboard);
        setLearners(learnersData.learners);
      })
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
  const currentCourse = data.activePaths.find((p) => p.nextStep?.type === 'course');

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
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {data.activePaths.map((path) => (
              <MyPathCard key={path.id} path={path} />
            ))}
          </div>
        )}
        <Link to="/journeys" className="mt-4 inline-block text-sm font-medium text-accent-dark hover:underline">
          + Explore more learning paths
        </Link>
      </section>

      {/* Learners Like You — the core differentiator, made relatable through real (demo) journeys */}
      <section className="mt-14">
        <h2 className="font-display text-xl text-charcoal">Learners Like You</h2>
        <p className="mt-1.5 text-sm text-charcoal-soft">People who started where you are and the paths they followed.</p>

        {learners.length === 0 ? (
          <p className="mt-4 text-sm text-charcoal-soft">Complete onboarding to get personalized matches.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {learners.map((learner) => (
              <LearnerCard key={learner.id} learner={learner} />
            ))}
          </div>
        )}
      </section>

      {/* Continue Learning — the single most relevant next step, never the next locked course */}
      {currentCourse?.nextStep && (
        <section className="mt-14">
          <h2 className="font-display text-lg text-charcoal">Continue Learning</h2>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-charcoal">{currentCourse.nextStep.title}</p>
              <ProgressBar value={currentCourse.nextStep.progressPercent || 0} className="mt-2 max-w-xs" />
            </div>
            <Button to={`/courses/${currentCourse.nextStep.slug}`} className="shrink-0">Continue</Button>
          </div>
        </section>
      )}

      {/* Recommendations — proper cards, capped at 2 each */}
      {hasRecommendations && (
        <section className="mt-14">
          {data.recommendedCourses.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-charcoal">Recommended Courses</h2>
                <Link to="/courses" className="text-xs font-medium text-accent-dark hover:underline">View all</Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {data.recommendedCourses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            </div>
          )}
          {data.recommendedProjects.length > 0 && (
            <div className="mt-10">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg text-charcoal">Recommended Projects</h2>
                <Link to="/projects" className="text-xs font-medium text-accent-dark hover:underline">View all</Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {data.recommendedProjects.map((project) => (
                  <ProjectCard key={project.slug} project={project} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Upcoming Assessment — practice/validate what the current course teaches */}
      {data.suggestedAssessment && (
        <section className="mt-14">
          <h2 className="font-display text-lg text-charcoal">Upcoming Assessment</h2>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-charcoal">{data.suggestedAssessment.title}</p>
              <p className="mt-1 text-sm text-charcoal-soft">{data.suggestedAssessment.question_count} questions</p>
            </div>
            <Button to={`/assessments/${data.suggestedAssessment.slug}`} variant="secondary" className="shrink-0">Start Assessment</Button>
          </div>
        </section>
      )}

      {/* Recent Activity — compact activity cards */}
      <section className="mt-14">
        <h2 className="font-display text-lg text-charcoal">Recent Activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal-soft">Nothing yet — complete a lesson or project to see it here.</p>
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
