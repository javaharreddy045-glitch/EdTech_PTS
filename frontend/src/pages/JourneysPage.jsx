import { useEffect, useState } from 'react';
import { journeysApi, goalsApi } from '../api/endpoints.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { JourneyCard } from '../components/JourneyCard.jsx';
import { CardSkeletonGrid } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Button } from '../components/Button.jsx';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const DURATIONS = [
  { label: 'Any duration', min: '', max: '' },
  { label: 'Up to 16 weeks', min: '', max: '16' },
  { label: '16–22 weeks', min: '16', max: '22' },
  { label: '22+ weeks', min: '22', max: '' },
];
const SORTS = [
  { value: 'alphabetical', label: 'A–Z' },
  { value: 'duration_asc', label: 'Shortest first' },
  { value: 'duration_desc', label: 'Longest first' },
  { value: 'newest', label: 'Newest' },
];

const DEFAULT_FILTERS = { search: '', goal: '', level: '', duration: 0, outcome: '', sort: 'alphabetical' };

export function JourneysPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [goals, setGoals] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedOutcome = useDebounce(filters.outcome, 300);

  useEffect(() => {
    goalsApi.list().then((data) => setGoals(data.goals));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const duration = DURATIONS[filters.duration];
    journeysApi
      .list({
        search: debouncedSearch,
        goal: filters.goal,
        level: filters.level,
        minDuration: duration.min,
        maxDuration: duration.max,
        outcome: debouncedOutcome,
        sort: filters.sort,
      })
      .then((data) => setJourneys(data.journeys))
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, filters.goal, filters.level, filters.duration, debouncedOutcome, filters.sort]);

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const activeFilterCount = [filters.goal, filters.level, filters.duration !== 0, filters.outcome].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-2xl text-charcoal sm:text-3xl">Find Your Path</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-charcoal-soft">
          Discover learning journeys followed by learners like you.
        </p>
      </header>

      {goals.length > 0 && (
        <div className="animate-fade-up mt-5 flex flex-wrap gap-2">
          {goals.map((goal) => {
            const isActive = filters.goal === goal.slug;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, goal: isActive ? '' : goal.slug }))}
                aria-pressed={isActive}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-150 ${
                  isActive ? 'border-accent bg-accent text-white' : 'border-border bg-white text-charcoal-soft hover:border-accent/60'
                }`}
              >
                {goal.title}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="journey-search" className="sr-only">What do you want to learn?</label>
            <input
              id="journey-search"
              type="search"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="What do you want to learn? (e.g. full-stack development, AI, product design...)"
              className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="journey-filters"
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal sm:hidden"
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        <div
          id="journey-filters"
          className={`grid grid-cols-1 gap-3 overflow-hidden transition-[max-height] duration-300 ease-out sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5 ${
            filtersOpen ? 'max-h-96' : 'max-h-0 sm:max-h-none'
          }`}
        >
          <select
            aria-label="Filter by goal"
            value={filters.goal}
            onChange={(e) => setFilters((f) => ({ ...f, goal: e.target.value }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">All goals</option>
            {goals.map((g) => (
              <option key={g.id} value={g.slug}>{g.title}</option>
            ))}
          </select>

          <select
            aria-label="Filter by starting level"
            value={filters.level}
            onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm capitalize focus:border-accent focus:outline-none"
          >
            <option value="">Any starting level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l} className="capitalize">{l}</option>
            ))}
          </select>

          <select
            aria-label="Filter by duration"
            value={filters.duration}
            onChange={(e) => setFilters((f) => ({ ...f, duration: Number(e.target.value) }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            {DURATIONS.map((d, i) => (
              <option key={d.label} value={i}>{d.label}</option>
            ))}
          </select>

          <input
            aria-label="Filter by outcome"
            type="text"
            value={filters.outcome}
            onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value }))}
            placeholder="Outcome (e.g. Developer)"
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />

          <select
            aria-label="Sort journeys"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {activeFilterCount > 0 && (
          <div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <CardSkeletonGrid count={6} />
        ) : journeys.length === 0 ? (
          <EmptyState
            title="No journeys match your filters"
            description="Try widening your search or resetting filters."
            action={<Button variant="secondary" onClick={resetFilters}>Reset filters</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {journeys.map((journey) => (
              <JourneyCard key={journey.id} journey={journey} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
