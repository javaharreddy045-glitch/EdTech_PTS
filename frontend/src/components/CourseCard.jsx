import { Link } from 'react-router-dom';
import { RatingStars } from './RatingStars.jsx';

const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export function CourseCard({ course }) {
  const metaBits = [course.skills?.[0], course.project_count > 0 ? `${course.project_count} project${course.project_count !== 1 ? 's' : ''}` : null].filter(Boolean);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-cream-dim">
        <img
          src={course.image_url}
          alt={course.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-display text-base font-medium leading-snug text-charcoal">{course.title}</h3>
        {course.instructor_name && <p className="text-sm text-charcoal-soft">{course.instructor_name}</p>}
        <p className="text-xs text-charcoal-soft">
          {DIFFICULTY_LABEL[course.difficulty] || course.difficulty} · {Number(course.duration_hours)} hrs
        </p>
        <RatingStars rating={course.rating_avg} count={course.rating_count} />
        {metaBits.length > 0 && <p className="text-xs text-charcoal-soft">{metaBits.join(' · ')}</p>}
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark">
          View Course
          <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
