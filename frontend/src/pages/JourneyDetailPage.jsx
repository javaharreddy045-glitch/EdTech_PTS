import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { journeysApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { SkillPill } from '../components/SkillPill.jsx';
import { JourneyTimeline } from '../components/JourneyTimeline.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

export function JourneyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [journey, setJourney] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    journeysApi
      .getBySlug(slug)
      .then((data) => {
        setJourney(data.journey);
        setIsFollowing(data.journey.isFollowing);
        setIsSaved(data.journey.isSaved);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  async function handleFollow() {
    if (!isAuthenticated) return navigate('/login', { state: { from: { pathname: `/journeys/${slug}` } } });
    setIsSubmitting(true);
    try {
      await journeysApi.follow(slug);
      setIsFollowing(true);
      setActionMessage('This journey is now your active learning path.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSave() {
    if (!isAuthenticated) return navigate('/login', { state: { from: { pathname: `/journeys/${slug}` } } });
    const { saved } = await journeysApi.toggleSave(slug);
    setIsSaved(saved);
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
        <h2 className="font-display text-xl text-charcoal">The Journey</h2>
        <div className="mt-5">
          <JourneyTimeline steps={journey.steps} />
        </div>
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
          <p className="font-medium text-charcoal">{isFollowing ? "You're following this journey" : 'Ready to follow this path?'}</p>
          {actionMessage && <p className="text-sm text-accent-dark">{actionMessage}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave}>
            {isSaved ? 'Saved' : 'Save Journey'}
          </Button>
          {isFollowing ? (
            <Button to="/learning-path">View My Path</Button>
          ) : (
            <Button onClick={handleFollow} disabled={isSubmitting}>
              {isSubmitting ? 'Following...' : 'Follow This Journey'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
