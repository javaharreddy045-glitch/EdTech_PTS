import { Link } from 'react-router-dom';
import { ProgressBar } from './ProgressBar.jsx';

const STATUS_LABEL = {
  completed: '✓ Completed',
  in_progress: 'In progress',
};

export function ProjectCard({ project }) {
  const statusLabel = STATUS_LABEL[project.status];
  const metaBits = [project.skills?.[0], project.skills?.[1]].filter(Boolean);

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-cream-dim">
        <img
          src={project.image_url}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-medium leading-snug text-charcoal">{project.title}</h3>
          {statusLabel && <span className="shrink-0 text-xs font-medium text-accent-dark">{statusLabel}</span>}
        </div>
        {project.description && <p className="line-clamp-1 text-sm text-charcoal-soft">{project.description}</p>}
        <p className="text-xs capitalize text-charcoal-soft">
          {project.difficulty} · {Number(project.estimated_hours)} hrs
        </p>
        {metaBits.length > 0 && <p className="text-xs text-charcoal-soft">{metaBits.join(' · ')}</p>}
        {project.status === 'in_progress' && <ProgressBar value={project.progressPercent} className="mt-1" />}
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark">
          View Project
          <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
