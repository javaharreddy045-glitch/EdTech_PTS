import { Button } from './Button.jsx';

export function LearnerCard({ learner }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-charcoal/5">
      <div className="flex items-center gap-3">
        <img src={learner.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p className="truncate font-display text-base text-charcoal">{learner.name}</p>
          <p className="truncate text-xs text-charcoal-soft">{learner.goalTitle}</p>
        </div>
      </div>

      <p className="text-sm text-charcoal-soft">
        Started as <span className="capitalize text-charcoal">{learner.startingLevel}</span> · Now{' '}
        <span className="capitalize text-charcoal">{learner.currentLevel}</span>
      </p>

      <p className="text-sm text-charcoal-soft">
        {learner.coursesCompleted}/{learner.totalCourses} courses · {learner.projectsCompleted}/{learner.totalProjects} projects
      </p>

      <div className="mt-1 flex items-center gap-2">
        <Button to={`/journeys/${learner.journeySlug}`} size="sm">
          View Journey
        </Button>
        <Button to={`/learners/${learner.id}`} size="sm" variant="secondary">
          View Profile
        </Button>
      </div>
    </div>
  );
}
