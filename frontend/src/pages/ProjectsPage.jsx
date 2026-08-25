import { useEffect, useState } from 'react';
import { projectsApi } from '../api/endpoints.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { ProjectCard } from '../components/ProjectCard.jsx';
import { CardSkeletonGrid } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Button } from '../components/Button.jsx';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const DEFAULT_FILTERS = { search: '', difficulty: '' };

export function ProjectsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    setIsLoading(true);
    projectsApi.list({ search: debouncedSearch, difficulty: filters.difficulty }).then((data) => setProjects(data.projects)).finally(() => setIsLoading(false));
  }, [debouncedSearch, filters.difficulty]);

  const activeFilterCount = [filters.difficulty].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-2xl text-charcoal sm:text-3xl">Projects</h1>
        <p className="mt-1.5 text-sm text-charcoal-soft">Build real things and track your completion.</p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          aria-label="Search projects"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search projects..."
          className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
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
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
            Reset
          </Button>
        )}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <CardSkeletonGrid count={6} />
        ) : projects.length === 0 ? (
          <EmptyState title="No projects match your search" description="Try a different keyword or difficulty." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
