import { Link } from 'react-router-dom';
import { RatingStars } from './RatingStars.jsx';
import { SkillPill } from './SkillPill.jsx';

const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div className="aspect-video w-full overflow-hidden bg-cream-dim">
        <img
          src={course.image_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between text-xs text-charcoal-soft">
          <span>{DIFFICULTY_LABEL[course.difficulty] || course.difficulty}</span>
          <span>{Number(course.duration_hours)} hrs</span>
        </div>
        <h3 className="font-display text-base font-medium leading-snug text-charcoal">{course.title}</h3>
        {course.instructor_name && <p className="text-sm text-charcoal-soft">{course.instructor_name}</p>}
        <div className="flex items-center justify-between text-xs">
          <RatingStars rating={course.rating_avg} count={course.rating_count} />
          <span className="text-charcoal-soft">{course.learner_count} learners</span>
        </div>
        {course.skills?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {course.skills.slice(0, 3).map((skill) => (
              <SkillPill key={skill}>{skill}</SkillPill>
            ))}
          </div>
        )}
        {course.project_count > 0 && (
          <p className="mt-auto pt-1 text-xs text-charcoal-soft">{course.project_count} project{course.project_count !== 1 ? 's' : ''} included</p>
        )}
      </div>
    </Link>
  );
}
