import { Link } from 'react-router-dom';
import { SkillPill } from './SkillPill.jsx';

const STATUS_LABEL = {
  completed: { text: 'Completed', className: 'bg-accent-soft text-accent-dark' },
  in_progress: { text: 'In progress', className: 'bg-cream-dim text-warn' },
  not_started: { text: 'Not started', className: 'bg-cream-dim text-charcoal-soft' },
};

export function ProjectCard({ project }) {
  const status = STATUS_LABEL[project.status] || STATUS_LABEL.not_started;
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-white p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-cream-dim">
        <img src={project.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
      </div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-medium text-charcoal">{project.title}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.text}</span>
      </div>
      {project.description && <p className="line-clamp-2 text-sm text-charcoal-soft">{project.description}</p>}
      <div className="flex items-center justify-between text-xs text-charcoal-soft">
        <span className="capitalize">{project.difficulty}</span>
        <span>{Number(project.estimated_hours)} hrs</span>
      </div>
      {project.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.skills.slice(0, 3).map((skill) => (
            <SkillPill key={skill}>{skill}</SkillPill>
          ))}
        </div>
      )}
    </Link>
  );
}
