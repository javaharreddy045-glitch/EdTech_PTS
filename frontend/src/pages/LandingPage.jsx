import { Link } from 'react-router-dom';
import { Button } from '../components/Button.jsx';

const STEPS = [
  { title: 'What do I want to become?', description: 'Choose a goal — Full-Stack Developer, AI/ML Engineer, Product Designer, and more.' },
  { title: 'Where am I starting from?', description: 'Tell us your current level and the skills you already have.' },
  { title: 'What did similar learners do?', description: 'See the exact courses, projects, and order a learner like you followed.' },
  { title: 'What should I learn next?', description: 'Follow that path, track your progress, and adapt it as you go.' },
];

const SAMPLE_CHAIN = ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Full-Stack Project'];

export function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-dark">PathToSkill</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-medium leading-tight text-charcoal sm:text-5xl">
          Find the path. Build the skill.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-charcoal-soft sm:text-lg">
          Discover learning journeys followed by learners like you, choose a path that fits your goal, and
          build your skills through structured courses, projects, and assessments.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button to="/signup" size="lg">
            Start your journey
          </Button>
          <Button to="/journeys" size="lg" variant="secondary">
            Browse learning journeys
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-dark">Learner Journey #01</p>
          <h2 className="mt-1 font-display text-xl text-charcoal">Full-Stack Development Journey</h2>
          <p className="mt-1 text-sm text-charcoal-soft">
            Started with: Basic JavaScript · 8 courses · 3 projects
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {SAMPLE_CHAIN.map((step, i) => (
              <span key={step} className="flex items-center gap-1.5">
                <span className="rounded-full bg-cream-dim px-3 py-1.5 text-sm text-charcoal">{step}</span>
                {i < SAMPLE_CHAIN.length - 1 && <span aria-hidden="true" className="text-charcoal-soft">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-dim/50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl text-charcoal sm:text-3xl">
            Four questions. One clear path.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-display text-sm text-accent-dark">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-display text-base text-charcoal">{step.title}</h3>
                <p className="mt-1.5 text-sm text-charcoal-soft">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-2xl text-charcoal sm:text-3xl">Ready to find your path?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-charcoal-soft">
          Tell us your goal and starting point — we'll show you how learners like you got there.
        </p>
        <div className="mt-6">
          <Button to="/signup" size="lg">
            Get started for free
          </Button>
        </div>
      </section>
    </div>
  );
}
