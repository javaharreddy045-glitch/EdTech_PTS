import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { assessmentsApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Skeleton.jsx';

export function AssessmentTakePage() {
  const { slug } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    assessmentsApi.getBySlug(slug).then((data) => setAssessment(data.assessment)).finally(() => setIsLoading(false));
  }, [slug]);

  function selectAnswer(questionId, index) {
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId: Number(questionId),
        selectedIndex,
      }));
      const data = await assessmentsApi.submit(slug, payload);
      setResult(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }
  if (!assessment) return null;

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">Result</p>
        <h1 className="mt-2 font-display text-4xl text-charcoal">{result.score}%</h1>
        <p className="mt-3 text-sm text-charcoal-soft">
          {result.correctCount} of {result.total} correct · Assessed level: <span className="font-medium capitalize text-charcoal">{result.resultingLevel}</span>
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/assessments" variant="secondary">Back to Assessments</Button>
          <Button to="/dashboard">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const allAnswered = assessment.questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl text-charcoal sm:text-3xl">{assessment.title}</h1>
      <p className="mt-1.5 text-sm text-charcoal-soft">{assessment.description}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        {assessment.questions.map((question, qIndex) => (
          <fieldset key={question.id} className="rounded-2xl border border-border bg-white p-5">
            <legend className="font-medium text-charcoal">
              {qIndex + 1}. {question.question_text}
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              {question.options.map((option, i) => (
                <label
                  key={option}
                  className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                    answers[question.id] === i ? 'border-accent bg-accent-soft/50' : 'border-border bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={answers[question.id] === i}
                    onChange={() => selectAnswer(question.id, i)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <Button type="submit" disabled={!allAnswered || isSubmitting} className="self-start">
          {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
        </Button>
      </form>
    </div>
  );
}
