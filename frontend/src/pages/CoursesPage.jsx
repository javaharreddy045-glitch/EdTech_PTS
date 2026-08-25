import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { coursesApi } from '../api/endpoints.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { CourseCard } from '../components/CourseCard.jsx';
import { CardSkeletonGrid } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Button } from '../components/Button.jsx';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const DURATIONS = [
  { label: 'Any duration', min: '', max: '' },
  { label: 'Under 15 hrs', min: '', max: '15' },
  { label: '15–25 hrs', min: '15', max: '25' },
  { label: '25+ hrs', min: '25', max: '' },
];
const RATINGS = [
  { label: 'Any rating', value: '' },
  { label: '4.5 & up', value: '4.5' },
  { label: '4.0 & up', value: '4' },
  { label: '3.5 & up', value: '3.5' },
];
const SORTS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'duration_asc', label: 'Shortest first' },
];

const DEFAULT_FILTERS = { search: '', category: '', skill: '', difficulty: '', duration: 0, rating: '', sort: 'popular' };

export function CoursesPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, skill: searchParams.get('skill') || '' });
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ courses: [], total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    coursesApi.categories().then((data) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.category, filters.skill, filters.difficulty, filters.duration, filters.rating, filters.sort]);

  useEffect(() => {
    setIsLoading(true);
    const duration = DURATIONS[filters.duration];
    coursesApi
      .list({
        search: debouncedSearch,
        category: filters.category,
        skill: filters.skill,
        difficulty: filters.difficulty,
        minDuration: duration.min,
        maxDuration: duration.max,
        minRating: filters.rating,
        sort: filters.sort,
        page,
      })
      .then(setResult)
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, filters.category, filters.skill, filters.difficulty, filters.duration, filters.rating, filters.sort, page]);

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const activeFilterCount = [filters.category, filters.skill, filters.difficulty, filters.duration !== 0, filters.rating].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-2xl text-charcoal sm:text-3xl">Courses</h1>
        <p className="mt-1.5 text-sm text-charcoal-soft">Search and filter the full course catalog.</p>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="course-search" className="sr-only">Search courses</label>
            <input
              id="course-search"
              type="search"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search courses..."
              className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="course-filters"
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal sm:hidden"
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        <div
          id="course-filters"
          className={`grid grid-cols-1 gap-3 overflow-hidden transition-[max-height] duration-300 ease-out sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5 ${
            filtersOpen ? 'max-h-96' : 'max-h-0 sm:max-h-none'
          }`}
        >
          <select
            aria-label="Filter by category"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            aria-label="Filter by difficulty"
            value={filters.difficulty}
            onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm capitalize focus:border-accent focus:outline-none"
          >
            <option value="">Any difficulty</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
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

          <select
            aria-label="Filter by rating"
            value={filters.rating}
            onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            {RATINGS.map((r) => (
              <option key={r.label} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select
            aria-label="Sort courses"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {(activeFilterCount > 0 || filters.search) && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
            <p className="text-xs text-charcoal-soft">{result.total} course{result.total !== 1 ? 's' : ''} found</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <CardSkeletonGrid count={9} />
        ) : result.courses.length === 0 ? (
          <EmptyState
            title="No courses match your search"
            description="Try a different keyword or reset your filters."
            action={<Button variant="secondary" onClick={resetFilters}>Reset filters</Button>}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {result.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Course pagination">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-charcoal-soft">
                  Page {result.page} of {result.totalPages}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
