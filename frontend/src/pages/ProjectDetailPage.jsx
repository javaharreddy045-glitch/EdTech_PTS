import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { SkillPill } from '../components/SkillPill.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';

export function ProjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    setIsLoading(true);
    projectsApi.getBySlug(slug).then((data) => setProject(data.project)).finally(() => setIsLoading(false));
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

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      await projectsApi.complete(project.id);
      load();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-56 w-full" />
      </div>
    );
  }
  if (!project) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="animate-fade-up">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-dark capitalize">{project.difficulty} project</p>
        <h1 className="mt-1 font-display text-3xl text-charcoal">{project.title}</h1>
        <img src={project.image_url} alt="" className="mt-5 w-full rounded-2xl" />
        <p className="mt-5 text-sm leading-relaxed text-charcoal-soft">{project.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.skills.map((s) => (
            <SkillPill key={s.id}>{s.name}</SkillPill>
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-charcoal-soft">Estimated time</dt>
            <dd className="mt-1 text-sm font-medium text-charcoal">{Number(project.estimated_hours)} hours</dd>
          </div>
          <div>
            <dt className="text-xs text-charcoal-soft">Difficulty</dt>
            <dd className="mt-1 text-sm font-medium capitalize text-charcoal">{project.difficulty}</dd>
          </div>
          <div>
            <dt className="text-xs text-charcoal-soft">Status</dt>
            <dd className="mt-1 text-sm font-medium capitalize text-charcoal">{project.status.replace('_', ' ')}</dd>
          </div>
        </dl>

        {project.status !== 'not_started' && (
          <ProgressBar value={project.progressPercent} label="Your progress" className="mt-5" />
        )}

        {project.relatedCourses?.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg text-charcoal">Related Courses</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {project.relatedCourses.map((c) => (
                <li key={c.id}>
                  <Link to={`/courses/${c.slug}`} className="text-sm font-medium text-accent-dark hover:underline">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {project.status === 'not_started' && (
            <Button onClick={handleStart} disabled={isSubmitting}>
              {isSubmitting ? 'Starting...' : 'Start Project'}
            </Button>
          )}
          {project.status === 'in_progress' && (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Mark as Complete'}
            </Button>
          )}
          {project.status === 'completed' && (
            <p className="rounded-full bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent-dark">Project completed 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
