import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { SkillPill } from '../components/SkillPill.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';

const TASK_TYPE_LABELS = {
  knowledge_check: 'Knowledge Check',
  code: 'Code',
  review: 'Review',
  deliverable: 'Deliverable',
};

const MILESTONE_STATUS_STYLE = {
  completed: 'border-accent bg-accent text-white',
  available: 'border-accent bg-white text-accent-dark',
  locked: 'border-border bg-white text-charcoal-soft',
};

function MilestoneNav({ milestones, activeMilestoneId, onSelect }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {milestones.map((milestone, i) => {
        const isActive = milestone.id === activeMilestoneId;
        const isLocked = milestone.status === 'locked';
        return (
          <li key={milestone.id}>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onSelect(milestone.id)}
              aria-current={isActive ? 'step' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                isActive ? 'bg-accent-soft/60' : 'hover:bg-cream-dim'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium ${MILESTONE_STATUS_STYLE[milestone.status]}`}
                aria-hidden="true"
              >
                {milestone.status === 'completed' ? '✓' : isLocked ? '🔒' : String(i + 1).padStart(2, '0')}
              </span>
              <span className={isLocked ? 'text-charcoal-soft' : 'text-charcoal'}>{milestone.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function MilestoneDetail({ milestone, onToggleTask, togglingId }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">
        Milestone {String(milestone.orderIndex).padStart(2, '0')}
      </p>
      <h2 className="mt-1 font-display text-xl text-charcoal">{milestone.title}</h2>
      {milestone.goal && <p className="mt-2 text-sm text-charcoal-soft">{milestone.goal}</p>}

      <ul className="mt-5 flex flex-col gap-2">
        {milestone.tasks.map((task) => (
          <li key={task.id}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                task.completed ? 'border-accent/40 bg-accent-soft/30' : 'border-border bg-white hover:border-accent/60'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                disabled={togglingId === task.id}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="flex-1">
                <span className={`text-sm ${task.completed ? 'text-charcoal-soft line-through' : 'text-charcoal'}`}>{task.title}</span>
                {TASK_TYPE_LABELS[task.taskType] && (
                  <span className="ml-2 rounded-full bg-cream-dim px-2 py-0.5 text-[11px] font-medium text-charcoal-soft">
                    {TASK_TYPE_LABELS[task.taskType]}
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-charcoal-soft">
        {milestone.completedCount} / {milestone.totalCount} completed
      </p>
      <ProgressBar value={milestone.totalCount > 0 ? (milestone.completedCount / milestone.totalCount) * 100 : 0} className="mt-2" />

      {milestone.status === 'completed' && (
        <p className="mt-4 text-sm font-medium text-accent-dark">✓ Milestone Complete</p>
      )}
    </div>
  );
}

function CompletionForm({ onSubmit, isSubmitting, error }) {
  const [githubUrl, setGithubUrl] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ githubUrl: githubUrl.trim() || undefined, deploymentUrl: deploymentUrl.trim() || undefined, submissionNotes: submissionNotes.trim() || undefined });
      }}
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-accent bg-accent-soft/30 p-5"
    >
      <p className="font-medium text-charcoal">All milestones complete — ready to submit?</p>
      <div>
        <label htmlFor="githubUrl" className="mb-1 block text-xs font-medium text-charcoal-soft">GitHub repository (optional)</label>
        <input
          id="githubUrl"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/you/project"
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="deploymentUrl" className="mb-1 block text-xs font-medium text-charcoal-soft">Live deployment (optional)</label>
        <input
          id="deploymentUrl"
          type="url"
          value={deploymentUrl}
          onChange={(e) => setDeploymentUrl(e.target.value)}
          placeholder="https://your-project.example.com"
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="submissionNotes" className="mb-1 block text-xs font-medium text-charcoal-soft">Notes (optional)</label>
        <textarea
          id="submissionNotes"
          rows={2}
          value={submissionNotes}
          onChange={(e) => setSubmissionNotes(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Submitting...' : 'Mark Project Complete'}
      </Button>
    </form>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [completeError, setCompleteError] = useState('');

  function load() {
    setIsLoading(true);
    projectsApi.getBySlug(slug).then((data) => {
      setProject(data.project);
      const current = data.project.workspace?.currentMilestone;
      setActiveMilestoneId(current ? current.id : data.project.workspace?.milestones[0]?.id || null);
    }).finally(() => setIsLoading(false));
  }

  useEffect(load, [slug]);

  async function handleStart() {
    if (!isAuthenticated) return navigate('/login', { state: { from: { pathname: `/projects/${slug}` } } });
    setIsSubmitting(true);
    try {
      await projectsApi.start(project.id);
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleTask(taskId) {
    setTogglingId(taskId);
    try {
      const { workspace } = await projectsApi.toggleTask(taskId);
      setProject((p) => ({ ...p, workspace, progressPercent: workspace.overallProgress }));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCompleteProject(payload) {
    setIsSubmitting(true);
    setCompleteError('');
    try {
      await projectsApi.complete(project.id, payload);
      load();
    } catch (err) {
      setCompleteError(err.message || 'Could not mark this project complete.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-56 w-full" />
      </div>
    );
  }
  if (!project) return null;

  const workspace = project.workspace;
  const activeMilestone = workspace?.milestones.find((m) => m.id === activeMilestoneId) || workspace?.milestones[0];

  // COMPLETED state
  if (project.status === 'completed') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-dark capitalize">{project.difficulty} project</p>
        <h1 className="mt-1 font-display text-3xl text-charcoal">{project.title}</h1>
        <div className="mt-6 rounded-2xl border border-accent bg-accent-soft/30 p-6 text-center">
          <p className="font-display text-2xl text-charcoal">✓ Project Completed</p>
          <p className="mt-2 text-sm text-charcoal-soft">Nice work — this project has been added to your completed projects.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-charcoal hover:border-accent">
              View GitHub Repo ↗
            </a>
          )}
          {project.deployment_url && (
            <a href={project.deployment_url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-charcoal hover:border-accent">
              View Live Deployment ↗
            </a>
          )}
        </div>
        {project.submission_notes && (
          <p className="mt-4 text-sm text-charcoal-soft">"{project.submission_notes}"</p>
        )}
        {project.relatedCourses?.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg text-charcoal">Related Courses</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {project.relatedCourses.map((c) => (
                <li key={c.id}>
                  <Link to={`/courses/${c.slug}`} className="text-sm font-medium text-accent-dark hover:underline">{c.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // WORKSPACE state
  if (project.status === 'in_progress' && workspace) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-dark capitalize">{project.difficulty} project</p>
        <h1 className="mt-1 font-display text-2xl text-charcoal sm:text-3xl">{project.title}</h1>
        <ProgressBar value={workspace.overallProgress} label="Project progress" className="mt-4 max-w-sm" />

        <div className="mt-3 sm:hidden">
          <label htmlFor="milestone-select" className="sr-only">Jump to milestone</label>
          <select
            id="milestone-select"
            value={activeMilestone?.id}
            onChange={(e) => setActiveMilestoneId(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            {workspace.milestones.map((m, i) => (
              <option key={m.id} value={m.id} disabled={m.status === 'locked'}>
                {i + 1}. {m.title} {m.status === 'locked' ? '(locked)' : m.status === 'completed' ? '(done)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-[220px_1fr]">
          <aside className="hidden sm:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Milestones</p>
            <MilestoneNav milestones={workspace.milestones} activeMilestoneId={activeMilestone?.id} onSelect={setActiveMilestoneId} />
          </aside>

          <div className="rounded-2xl border border-border bg-white p-6">
            {activeMilestone && (
              <MilestoneDetail milestone={activeMilestone} onToggleTask={handleToggleTask} togglingId={togglingId} />
            )}

            {workspace.allComplete && (
              <CompletionForm onSubmit={handleCompleteProject} isSubmitting={isSubmitting} error={completeError} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // OVERVIEW state (not started)
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-dark capitalize">{project.difficulty} project</p>
      <h1 className="mt-1 font-display text-3xl text-charcoal">{project.title}</h1>
      <img src={project.image_url} alt="" className="mt-5 w-full rounded-2xl" />

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-charcoal-soft">Difficulty</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-charcoal">{project.difficulty}</dd>
        </div>
        <div>
          <dt className="text-xs text-charcoal-soft">Estimated time</dt>
          <dd className="mt-1 text-sm font-medium text-charcoal">{Number(project.estimated_hours)} hours</dd>
        </div>
        <div>
          <dt className="text-xs text-charcoal-soft">Project progress</dt>
          <dd className="mt-1 text-sm font-medium text-charcoal">0%</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {project.skills.map((s) => (
          <SkillPill key={s.id}>{s.name}</SkillPill>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg text-charcoal">What you'll build</h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{project.description}</p>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg text-charcoal">What you'll practice</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {project.skills.map((s) => (
            <li key={s.id} className="flex gap-2 text-sm text-charcoal-soft">
              <span aria-hidden="true" className="text-accent">✓</span>
              {s.name}
            </li>
          ))}
        </ul>
      </div>

      {project.relatedCourses?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg text-charcoal">Related Courses</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {project.relatedCourses.map((c) => (
              <li key={c.id}>
                <Link to={`/courses/${c.slug}`} className="text-sm font-medium text-accent-dark hover:underline">{c.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <Button onClick={handleStart} disabled={isSubmitting}>
          {isSubmitting ? 'Starting...' : 'Start Project'}
        </Button>
      </div>
    </div>
  );
}
