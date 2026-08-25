import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lessonsApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

export function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setQuizAnswer(null);
    setQuizFeedback(null);
    lessonsApi.get(id).then(setData).finally(() => setIsLoading(false));
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

  if (!data) return null;
  const { lesson, completed, nextLesson, totalLessons, currentPosition } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to={`/courses/${lesson.course_slug}`} className="text-sm text-accent-dark hover:underline">
        ← Back to {lesson.course_title}
      </Link>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent-dark">
        Lesson {currentPosition} of {totalLessons}
      </p>
      <h1 className="mt-1 font-display text-2xl text-charcoal sm:text-3xl">{lesson.title}</h1>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal-soft">{lesson.content}</p>

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

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-charcoal-soft">{completed ? 'Completed' : 'Not yet completed'}</span>
        <div className="flex gap-2">
          {!completed && (
            <Button onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? 'Saving...' : nextLesson ? 'Mark Complete & Continue' : 'Mark Complete'}
            </Button>
          )}
          {completed && nextLesson && <Button to={`/lessons/${nextLesson.id}`}>Next Lesson</Button>}
          {completed && !nextLesson && <Button to={`/courses/${lesson.course_slug}`}>Back to Course</Button>}
        </div>
      </div>
    </div>
  );
}
