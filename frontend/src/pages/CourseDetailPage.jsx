import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { coursesApi, enrollmentsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { RatingStars } from '../components/RatingStars.jsx';
import { SkillPill } from '../components/SkillPill.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';

export function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [recommendationReason, setRecommendationReason] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      coursesApi.getBySlug(slug),
      coursesApi.curriculum(slug),
      coursesApi.related(slug),
      coursesApi.reviews(slug),
    ])
      .then(([courseData, curriculumData, relatedData, reviewsData]) => {
        setCourse(courseData.course);
        setEnrollment(courseData.enrollment);
        setRecommendationReason(courseData.recommendationReason);
        setCurriculum(curriculumData.lessons);
        setRelated(relatedData.courses);
        setReviews(reviewsData.reviews);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  async function handleEnroll() {
    if (!isAuthenticated) return navigate('/login', { state: { from: { pathname: `/courses/${slug}` } } });
    setIsEnrolling(true);
    try {
      const { enrollment: newEnrollment } = await enrollmentsApi.enroll(course.id);
      setEnrollment(newEnrollment);
      if (curriculum[0]) navigate(`/lessons/${curriculum[0].id}`);
    } finally {
      setIsEnrolling(false);
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

  if (!course) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="animate-fade-up grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">{course.category}</p>
          <h1 className="mt-1 font-display text-3xl text-charcoal">{course.title}</h1>
          <p className="mt-2 text-sm text-charcoal-soft">
            {course.instructor_name} · {course.instructor_title}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <RatingStars rating={course.rating_avg} count={course.rating_count} />
            <span className="text-charcoal-soft">{course.learner_count} learners</span>
            <span className="capitalize text-charcoal-soft">{course.difficulty}</span>
            <span className="text-charcoal-soft">{Number(course.duration_hours)} hours</span>
          </div>

          {recommendationReason && (
            <div className="mt-4 rounded-xl border border-accent/40 bg-accent-soft/40 p-3 text-sm text-accent-dark">
              {recommendationReason}
            </div>
          )}

          <p className="mt-6 text-sm leading-relaxed text-charcoal-soft">{course.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {course.skills.map((s) => (
              <SkillPill key={s.id}>{s.name}</SkillPill>
            ))}
          </div>

          {course.learning_outcomes?.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg text-charcoal">What you'll learn</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {course.learning_outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-2 text-sm text-charcoal-soft">
                    <span aria-hidden="true" className="text-accent">✓</span>
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-display text-lg text-charcoal">Curriculum</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {curriculum.map((lesson, i) => (
                <li key={lesson.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        lesson.completed ? 'bg-accent text-white' : 'bg-cream-dim text-charcoal-soft'
                      }`}
                      aria-hidden="true"
                    >
                      {lesson.completed ? '✓' : i + 1}
                    </span>
                    <span className="text-sm text-charcoal">{lesson.title}</span>
                  </div>
                  <span className="text-xs text-charcoal-soft">{lesson.duration_minutes} min</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg text-charcoal">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal-soft">No reviews yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <RatingStars rating={review.rating} />
                      <span className="text-xs text-charcoal-soft">{review.reviewer_name}</span>
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-charcoal-soft">{review.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {related.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg text-charcoal">Related Courses</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link to={`/courses/${r.slug}`} className="text-sm font-medium text-accent-dark hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-5 lg:sticky lg:top-24">
          <img src={course.image_url} alt="" className="w-full rounded-xl" />
          {enrollment ? (
            <>
              <ProgressBar value={enrollment.progress_percent} label="Your progress" className="mt-4" />
              <Button
                to={curriculum.find((l) => !l.completed)?.id ? `/lessons/${curriculum.find((l) => !l.completed).id}` : `/lessons/${curriculum[0]?.id}`}
                className="mt-4 w-full"
              >
                Continue Learning
              </Button>
            </>
          ) : (
            <Button onClick={handleEnroll} disabled={isEnrolling} className="mt-4 w-full">
              {isEnrolling ? 'Enrolling...' : course.price > 0 ? `Enroll · $${Number(course.price).toFixed(0)}` : 'Enroll for free'}
            </Button>
          )}
          <dl className="mt-5 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-charcoal-soft">Lessons</dt>
              <dd className="text-charcoal">{curriculum.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-charcoal-soft">Projects</dt>
              <dd className="text-charcoal">{course.project_count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-charcoal-soft">Difficulty</dt>
              <dd className="capitalize text-charcoal">{course.difficulty}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
