import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { journeysApi, learningPathApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { SkillPill } from '../components/SkillPill.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

const COURSE_STATUS = {
  completed: { label: '✓ Completed', cta: 'Review Course', dot: 'border-accent bg-accent text-white' },
  active: { label: '→ In Progress', cta: 'Continue Course', dot: 'border-accent bg-white text-accent-dark' },
  available: { label: 'Ready to start', cta: 'Start Course', dot: 'border-accent bg-white text-accent-dark' },
  locked: { label: '🔒 Locked', cta: null, dot: 'border-border bg-white text-charcoal-soft' },
};

function CoursePathCard({ course, index, onSkip, skippingId }) {
  const meta = COURSE_STATUS[course.status] || COURSE_STATUS.locked;
  return (
    <li className="relative">
      <span
        className={`absolute -left-[calc(1.5rem+9px)] top-6 flex h-4 w-4 items-center justify-center rounded-full border-2 ${meta.dot}`}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="font-display text-lg text-charcoal-soft">{String(index + 1).padStart(2, '0')}</span>
          <div className="min-w-0">
            <p className="font-medium text-charcoal">{course.title}</p>
            {course.description && <p className="mt-1 line-clamp-1 text-sm text-charcoal-soft">{course.description}</p>}
            <p className="mt-1.5 text-xs text-charcoal-soft">
              {meta.label}
              {course.status === 'active' && ` · ${Math.round(course.progressPercent)}%`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-9 sm:pl-0">
          {course.status === 'available' && (
            <button
              type="button"
              onClick={() => onSkip(course.id)}
              disabled={skippingId === course.id}
              className="text-xs font-medium text-charcoal-soft hover:text-accent-dark"
            >
              {skippingId === course.id ? 'Marking...' : 'I know this'}
            </button>
          )}
          {meta.cta ? (
            <Link
              to={`/courses/${course.slug}`}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-accent hover:text-accent-dark"
            >
              {meta.cta}
            </Link>
          ) : (
            <span className="rounded-full border border-border px-4 py-2 text-sm text-charcoal-soft">Locked</span>
          )}
        </div>
      </div>
    </li>
  );
}

export function JourneyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [journey, setJourney] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skippingId, setSkippingId] = useState(null);

  function load() {
    setIsLoading(true);
    journeysApi
      .getBySlug(slug)
      .then((data) => {
        setJourney(data.journey);
        setFollowStatus(data.journey.followStatus);
        setIsSaved(data.journey.isSaved);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [slug]);

  async function handleFollow() {
    if (!isAuthenticated) return navigate('/login', { state: { from: { pathname: `/journeys/${slug}` } } });
    setIsSubmitting(true);
    try {
      await journeysApi.follow(slug);
      setFollowStatus('active');
      setActionMessage('This journey has been added to My Learning Paths — following it never removes your other journeys.');
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePause() {
    setIsSubmitting(true);
    try {
      await journeysApi.unfollow(slug);
      setFollowStatus('abandoned');
      setActionMessage('Journey paused. Your progress is saved — resume anytime.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResume() {
    setIsSubmitting(true);
    try {
      await journeysApi.resume(slug);
      setFollowStatus('active');
      setActionMessage('Welcome back — this journey is active again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSave() {
    if (!isAuthenticated) return navigate('/login', { state: { from: { pathname: `/journeys/${slug}` } } });
    const { saved } = await journeysApi.toggleSave(slug);
    setIsSaved(saved);
  }

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
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    );
  }

  if (!journey) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="animate-fade-up text-xs font-medium uppercase tracking-wide text-accent-dark">{journey.learner_label}</p>
      <h1 className="animate-fade-up mt-1 font-display text-3xl text-charcoal">{journey.title}</h1>
      <p className="animate-fade-up mt-3 max-w-2xl text-sm text-charcoal-soft">{journey.description}</p>

      {followStatus && (
        <div className="animate-fade-up mt-5 max-w-sm">
          <ProgressBar value={journey.overallProgress} label="Your progress" />
        </div>
      )}

      <div className="animate-fade-up mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs text-charcoal-soft">Goal</p>
          <p className="mt-1 text-sm font-medium text-charcoal">{journey.goal_title}</p>
        </div>
        <div>
          <p className="text-xs text-charcoal-soft">Starting level</p>
          <p className="mt-1 text-sm font-medium capitalize text-charcoal">{journey.starting_level}</p>
        </div>
        <div>
          <p className="text-xs text-charcoal-soft">Courses · Projects</p>
          <p className="mt-1 text-sm font-medium text-charcoal">{journey.courses.length} · {journey.projects.length}</p>
        </div>
        <div>
          <p className="text-xs text-charcoal-soft">Outcome</p>
          <p className="mt-1 text-sm font-medium text-charcoal">{journey.outcome}</p>
        </div>
      </div>

      <div className="animate-fade-up mt-6 flex flex-wrap gap-2">
        <p className="mr-2 self-center text-sm text-charcoal-soft">Started with:</p>
        {journey.startingSkills.map((s) => (
          <SkillPill key={s.id}>{s.label || s.name}</SkillPill>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-charcoal">Learning Path</h2>
        <p className="mt-1 text-sm text-charcoal-soft">Where you started, what's done, and what comes next.</p>
        <ol className="mt-6 flex flex-col gap-4 border-l-2 border-border pl-6 sm:pl-8">
          {journey.courses.map((course, i) => (
            <CoursePathCard key={course.id} course={course} index={i} onSkip={handleSkip} skippingId={skippingId} />
          ))}
        </ol>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-charcoal">Skills Gained</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {journey.skillsGained.map((s) => (
            <SkillPill key={s.id} tone="accent">{s.name}</SkillPill>
          ))}
        </div>
      </div>

      <div className="sticky bottom-4 mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-charcoal">
            {followStatus === 'active' && "You're following this journey"}
            {followStatus === 'abandoned' && 'This journey is paused'}
            {followStatus === 'completed' && "You've completed this journey"}
            {!followStatus && 'Ready to follow this path?'}
          </p>
          {actionMessage && <p className="text-sm text-accent-dark">{actionMessage}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave}>
            {isSaved ? 'Saved' : 'Save Journey'}
          </Button>
          {followStatus === 'active' && (
            <>
              <Button variant="secondary" onClick={handlePause} disabled={isSubmitting}>
                Pause
              </Button>
              <Button to="/learning-path">View My Paths</Button>
            </>
          )}
          {followStatus === 'abandoned' && (
            <Button onClick={handleResume} disabled={isSubmitting}>
              {isSubmitting ? 'Resuming...' : 'Resume Journey'}
            </Button>
          )}
          {(followStatus === 'completed' || !followStatus) && (
            <Button onClick={handleFollow} disabled={isSubmitting}>
              {isSubmitting ? 'Following...' : 'Follow This Journey'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
