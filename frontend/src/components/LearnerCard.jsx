import { Link } from 'react-router-dom';
import { SkillPill } from './SkillPill.jsx';

export function LearnerCard({ learner }) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-charcoal/5">
      <div className="flex items-center gap-3">
        <img src={learner.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="truncate font-display text-base text-charcoal">{learner.name}</p>
          <p className="truncate text-xs text-charcoal-soft">{learner.goalTitle}</p>
        </div>
      </div>

      <div className="text-sm">
        <p className="text-charcoal-soft">
          Started with: <span className="text-charcoal">{learner.startingSkillLabel}</span>
        </p>
        <p className="mt-1 text-charcoal-soft">
          {learner.coursesCompleted} courses · {learner.projectsCompleted} projects
        </p>
      </div>

      {learner.skillsGained?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {learner.skillsGained.slice(0, 3).map((skill) => (
            <SkillPill key={skill}>{skill}</SkillPill>
          ))}
        </div>
      )}

      <p className="text-xs text-charcoal-soft">
        Current: <span className="capitalize text-charcoal">{learner.currentLevel}</span>
      </p>

      <div className="mt-auto flex items-center gap-4 pt-1 text-sm font-medium">
        <Link to={`/journeys/${learner.journeySlug}`} className="text-accent-dark hover:underline">
          View Learning Journey
        </Link>
        <Link to={`/learners/${learner.id}`} className="text-charcoal-soft transition-colors group-hover:text-accent-dark">
          View Profile
        </Link>
      </div>
    </div>
  );
}
