import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, goalsApi, journeysApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { TextField } from '../components/TextField.jsx';
import { SkillPill } from '../components/SkillPill.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [savedJourneys, setSavedJourneys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '', currentLevel: '', goalId: '' });

  function load() {
    setIsLoading(true);
    Promise.all([usersApi.getMe(), goalsApi.list(), journeysApi.saved()])
      .then(([userData, goalsData, savedData]) => {
        setProfile(userData);
        setGoals(goalsData.goals);
        setSavedJourneys(savedData.journeys);
        setForm({
          name: userData.user.name || '',
          bio: userData.user.bio || '',
          avatarUrl: userData.user.avatar_url || '',
          currentLevel: userData.user.current_level || '',
          goalId: userData.user.goal_id || '',
        });
      })
      .catch((err) => setError(err.message || 'Could not load your profile.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await usersApi.updateMe(form);
      await refreshUser();
      setIsEditing(false);
      load();
    } finally {
      setIsSaving(false);
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

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState title="Couldn't load your profile" description={error || 'Please try refreshing the page.'} />
      </div>
    );
  }

  const { user, skills, completedCourses, completedProjects } = profile;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-display text-xl text-accent-dark">
            {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user.name?.[0]}
          </div>
          <div>
            <h1 className="font-display text-2xl text-charcoal">{user.name}</h1>
            <p className="text-sm text-charcoal-soft">{user.goal_title || 'No goal set'} · <span className="capitalize">{user.current_level || 'level not set'}</span></p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsEditing((v) => !v)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
          <TextField id="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-charcoal">Bio</label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <TextField id="avatarUrl" label="Avatar URL" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          <div>
            <label htmlFor="goal" className="mb-1.5 block text-sm font-medium text-charcoal">Goal</label>
            <select
              id="goal"
              value={form.goalId}
              onChange={(e) => setForm({ ...form, goalId: e.target.value })}
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="level" className="mb-1.5 block text-sm font-medium text-charcoal">Current level</label>
            <select
              id="level"
              value={form.currentLevel}
              onChange={(e) => setForm({ ...form, currentLevel: e.target.value })}
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm capitalize focus:border-accent focus:outline-none"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isSaving} className="self-start">
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      ) : (
        user.bio && <p className="mt-6 text-sm text-charcoal-soft">{user.bio}</p>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg text-charcoal">Skills</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.length === 0 ? (
            <p className="text-sm text-charcoal-soft">No skills recorded yet.</p>
          ) : (
            skills.map((s) => <SkillPill key={s.id}>{s.name}</SkillPill>)
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg text-charcoal">Completed Courses</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {completedCourses.length === 0 ? (
              <p className="text-sm text-charcoal-soft">None yet.</p>
            ) : (
              completedCourses.map((c) => (
                <li key={c.id}>
                  <Link to={`/courses/${c.slug}`} className="text-sm text-accent-dark hover:underline">{c.title}</Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg text-charcoal">Completed Projects</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {completedProjects.length === 0 ? (
              <p className="text-sm text-charcoal-soft">None yet.</p>
            ) : (
              completedProjects.map((p) => (
                <li key={p.id}>
                  <Link to={`/projects/${p.slug}`} className="text-sm text-accent-dark hover:underline">{p.title}</Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg text-charcoal">Saved Journeys</h2>
        <ul className="mt-3 flex flex-col gap-1.5">
          {savedJourneys.length === 0 ? (
            <p className="text-sm text-charcoal-soft">You haven't saved any journeys yet.</p>
          ) : (
            savedJourneys.map((j) => (
              <li key={j.id}>
                <Link to={`/journeys/${j.slug}`} className="text-sm text-accent-dark hover:underline">{j.title}</Link>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-8">
        <Button to="/learning-path" variant="secondary">View My Learning Path</Button>
      </div>
    </div>
  );
}
