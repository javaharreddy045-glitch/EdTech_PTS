import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: "I'm just getting started." },
  { value: 'intermediate', label: 'Intermediate', description: 'I know the basics and want to go further.' },
  { value: 'advanced', label: 'Advanced', description: 'I have solid experience already.' },
];

const PREFERENCE_OPTIONS = [
  { value: 'courses', label: 'Courses', description: 'Structured lessons and curriculum.' },
  { value: 'projects', label: 'Projects', description: 'Learning by building real things.' },
  { value: 'practice', label: 'Practice', description: 'Exercises, quizzes, and assessments.' },
  { value: 'mixed', label: 'A mix of everything', description: 'Courses, projects, and practice together.' },
];

const STEPS = ['Goal', 'Level', 'Skills', 'Preference'];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState({ goals: [], skills: [] });
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [goalId, setGoalId] = useState(null);
  const [currentLevel, setCurrentLevel] = useState('');
  const [skillIds, setSkillIds] = useState([]);
  const [learningPreference, setLearningPreference] = useState('');

  useEffect(() => {
    onboardingApi
      .getOptions()
      .then(setOptions)
      .finally(() => setIsLoadingOptions(false));
  }, []);

  function toggleSkill(id) {
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  const canProceed = [!!goalId, !!currentLevel, true, !!learningPreference][step];

  async function handleFinish() {
    setError('');
    setIsSubmitting(true);
    try {
      await onboardingApi.submit({ goalId, currentLevel, skillIds, learningPreference });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not save your onboarding details.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const skillsByCategory = options.skills.reduce((acc, skill) => {
    (acc[skill.category] ||= []).push(skill);
    return acc;
  }, {});

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2" role="list" aria-label="Onboarding progress">
        {STEPS.map((label, i) => (
          <div key={label} role="listitem" className="flex flex-1 items-center gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-accent' : 'bg-cream-dim'
              }`}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-accent-dark">
        Step {step + 1} of {STEPS.length}
      </p>

      {isLoadingOptions ? (
        <p className="text-sm text-charcoal-soft">Loading...</p>
      ) : (
        <div className="animate-fade-up" key={step}>
          {step === 0 && (
            <fieldset>
              <legend className="font-display text-2xl text-charcoal">What do you want to become?</legend>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {options.goals.map((goal) => (
                  <label
                    key={goal.id}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors duration-150 ${
                      goalId === goal.id ? 'border-accent bg-accent-soft/60' : 'border-border bg-white hover:border-accent/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={goal.id}
                      checked={goalId === goal.id}
                      onChange={() => setGoalId(goal.id)}
                      className="sr-only"
                    />
                    <span className="font-medium text-charcoal">{goal.title}</span>
                    <p className="mt-1 text-xs text-charcoal-soft">{goal.description}</p>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="font-display text-2xl text-charcoal">What is your current level?</legend>
              <div className="mt-5 flex flex-col gap-3">
                {LEVEL_OPTIONS.map((level) => (
                  <label
                    key={level.value}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors duration-150 ${
                      currentLevel === level.value ? 'border-accent bg-accent-soft/60' : 'border-border bg-white hover:border-accent/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={level.value}
                      checked={currentLevel === level.value}
                      onChange={() => setCurrentLevel(level.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-charcoal">{level.label}</span>
                    <p className="mt-1 text-xs text-charcoal-soft">{level.description}</p>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="font-display text-2xl text-charcoal">What skills do you already have?</legend>
              <p className="mt-1 text-sm text-charcoal-soft">Select any that apply. You can skip this if you're starting from scratch.</p>
              <div className="mt-5 flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => {
                        const selected = skillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => toggleSkill(skill.id)}
                            aria-pressed={selected}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 ${
                              selected ? 'border-accent bg-accent text-white' : 'border-border bg-white text-charcoal-soft hover:border-accent/60'
                            }`}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset>
              <legend className="font-display text-2xl text-charcoal">What type of learning do you prefer?</legend>
              <div className="mt-5 flex flex-col gap-3">
                {PREFERENCE_OPTIONS.map((pref) => (
                  <label
                    key={pref.value}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors duration-150 ${
                      learningPreference === pref.value ? 'border-accent bg-accent-soft/60' : 'border-border bg-white hover:border-accent/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="preference"
                      value={pref.value}
                      checked={learningPreference === pref.value}
                      onChange={() => setLearningPreference(pref.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-charcoal">{pref.label}</span>
                    <p className="mt-1 text-xs text-charcoal-soft">{pref.description}</p>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={!canProceed || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Finish'}
          </Button>
        )}
      </div>
    </div>
  );
}
