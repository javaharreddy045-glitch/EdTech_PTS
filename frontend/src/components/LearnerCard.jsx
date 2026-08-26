import { Link } from 'react-router-dom';

export function LearnerCard({ learner }) {
  const topSkills = (learner.skillsGained || []).slice(0, 3);

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border bg-white p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-charcoal/5">
      <div className="flex items-center gap-3">
        <img src={learner.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="truncate font-display text-base text-charcoal">{learner.name}</p>
          <p className="truncate text-xs text-charcoal-soft">{learner.goalTitle}</p>
        </div>
      </div>

      <p className="text-sm text-charcoal-soft">
        Started with <span className="text-charcoal">{learner.startingSkillLabel}</span>
      </p>

      <p className="text-sm text-charcoal-soft">
        {learner.coursesCompleted} courses · {learner.projectsCompleted} projects
      </p>

      {topSkills.length > 0 && <p className="text-sm text-charcoal-soft">{topSkills.join(' → ')}</p>}

      <div className="mt-1 flex items-center gap-4 text-sm font-medium">
        <Link to={`/journeys/${learner.journeySlug}`} className="text-accent-dark hover:underline">
          View Journey
        </Link>
        <Link to={`/learners/${learner.id}`} className="text-charcoal-soft transition-colors group-hover:text-accent-dark">
          View Profile
        </Link>
      </div>
    </div>
  );
}
