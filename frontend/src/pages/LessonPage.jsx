import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lessonsApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

function formatDuration(minutes) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    setQuizAnswer(null);
    setQuizFeedback(null);
    lessonsApi
      .get(id)
      .then(setData)
      .catch((err) => setError(err.message || 'Could not open this lesson.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleComplete() {
    setIsCompleting(true);
    try {
      await lessonsApi.complete(id);
      if (data.nextLesson) {
        navigate(`/lessons/${data.nextLesson.id}`);
      } else {
        setData((d) => ({ ...d, completed: true }));
      }
    } finally {
      setIsCompleting(false);
    }
  }

  function handleQuizSubmit(e) {
    e.preventDefault();
    if (quizAnswer === null) return;
    const isCorrect = quizAnswer === data.lesson.quiz.options.correctIndex;
    setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          title="This lesson isn't available yet"
          description={error || 'Complete the previous lesson to unlock this one.'}
          action={<Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>}
        />
      </div>
    );
  }

  const { lesson, completed, previousLesson, nextLesson, totalLessons, currentPosition } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to={`/courses/${lesson.course_slug}`} className="text-sm text-accent-dark hover:underline">
        ← Back to {lesson.course_title}
      </Link>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent-dark">
        Lesson {currentPosition} of {totalLessons} · Estimated time: {formatDuration(lesson.duration_minutes)}
      </p>
      <h1 className="mt-1 font-display text-2xl text-charcoal sm:text-3xl">{lesson.title}</h1>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal-soft">{lesson.content}</p>

        {lesson.video_url && (
          <div className="mt-6 border-t border-border pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Learn with video</h2>
            <a
              href={lesson.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
            >
              <span aria-hidden="true">▶</span> Watch on YouTube
            </a>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-xs text-charcoal-soft">
              {lesson.video_provider && (
                <div>
                  <dt className="inline font-medium text-charcoal">Provider: </dt>
                  <dd className="inline">{lesson.video_provider}</dd>
                </div>
              )}
              {lesson.video_duration_minutes && (
                <div>
                  <dt className="inline font-medium text-charcoal">Duration: </dt>
                  <dd className="inline">{formatDuration(lesson.video_duration_minutes)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {lesson.resources?.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h2 className="text-sm font-medium text-charcoal">Resources</h2>
            <ul className="mt-2 flex flex-col gap-1">
              {lesson.resources.map((resource) => (
                <li key={resource.label}>
                  <a href={resource.url} className="text-sm text-accent-dark hover:underline">
                    {resource.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson.quiz && (
          <form onSubmit={handleQuizSubmit} className="mt-6 border-t border-border pt-4">
            <h2 className="text-sm font-medium text-charcoal">Quick check</h2>
            <fieldset className="mt-3">
              <legend className="text-sm text-charcoal-soft">{lesson.quiz.question}</legend>
              <div className="mt-3 flex flex-col gap-2">
                {lesson.quiz.options.choices.map((choice, i) => (
                  <label
                    key={choice}
                    className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                      quizAnswer === i ? 'border-accent bg-accent-soft/50' : 'border-border bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quiz"
                      value={i}
                      checked={quizAnswer === i}
                      onChange={() => setQuizAnswer(i)}
                      className="sr-only"
                    />
                    {choice}
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit" size="sm" variant="secondary" className="mt-3" disabled={quizAnswer === null}>
              Check answer
            </Button>
            {quizFeedback && (
              <p role="status" className={`mt-2 text-sm ${quizFeedback === 'correct' ? 'text-accent-dark' : 'text-danger'}`}>
                {quizFeedback === 'correct' ? 'Correct!' : 'Not quite — review the lesson and try again.'}
              </p>
            )}
          </form>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {previousLesson && (
            <Link to={`/lessons/${previousLesson.id}`} className="text-sm font-medium text-charcoal-soft hover:text-accent-dark">
              ← Previous
            </Link>
          )}
          <span className="text-sm text-charcoal-soft">{completed ? '✓ Lesson completed' : 'Not yet completed'}</span>
        </div>
        <div className="flex gap-2">
          {!completed && (
            <Button onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? 'Saving...' : nextLesson ? 'Mark Complete & Continue' : 'Mark Complete'}
            </Button>
          )}
          {completed && nextLesson && <Button to={`/lessons/${nextLesson.id}`}>Next Lesson →</Button>}
          {completed && !nextLesson && <Button to={`/courses/${lesson.course_slug}`}>Back to Course</Button>}
        </div>
      </div>
    </div>
  );
}
