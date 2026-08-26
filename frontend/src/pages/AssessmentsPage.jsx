import { useEffect, useState } from 'react';
import { assessmentsApi } from '../api/endpoints.js';
import { Button } from '../components/Button.jsx';
import { CardSkeletonGrid } from '../components/Skeleton.jsx';

export function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([assessmentsApi.list(), assessmentsApi.myResults().catch(() => ({ results: [] }))])
      .then(([a, r]) => {
        setAssessments(a.assessments);
        setResults(r.results);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const latestResultBySlug = Object.fromEntries(results.map((r) => [r.assessment_slug, r]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-2xl text-charcoal sm:text-3xl">Skill Assessments</h1>
        <p className="mt-1.5 text-sm text-charcoal-soft">Quick checks to confirm your level and sharpen your recommendations.</p>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <CardSkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assessments.map((assessment) => {
              const result = latestResultBySlug[assessment.slug];
              return (
                <div key={assessment.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-5">
                  <h2 className="font-display text-lg text-charcoal">{assessment.title}</h2>
                  <p className="text-sm text-charcoal-soft">{assessment.question_count} questions · {assessment.skill_name}</p>
                  {result && (
                    <p className="text-sm text-accent-dark">
                      Last score: {result.score}% ({result.resulting_level})
                    </p>
                  )}
                  <Button to={`/assessments/${assessment.slug}`} size="sm" className="mt-2 self-start">
                    {result ? 'Retake' : 'Start Assessment'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
