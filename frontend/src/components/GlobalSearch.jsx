import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce.js';
import { useOnClickOutside } from '../hooks/useOnClickOutside.js';
import { searchApi } from '../api/endpoints.js';

const CATEGORY_CONFIG = [
  { key: 'journeys', label: 'Learning Journeys', path: (item) => `/journeys/${item.slug}` },
  { key: 'courses', label: 'Courses', path: (item) => `/courses/${item.slug}` },
  { key: 'projects', label: 'Projects', path: (item) => `/projects/${item.slug}` },
  { key: 'skills', label: 'Skills', path: (item) => `/courses?skill=${item.slug}` },
  { key: 'instructors', label: 'Instructors', path: () => null },
];

export function GlobalSearch({ className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useOnClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    searchApi
      .search(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults({ courses: [], journeys: [], projects: [], skills: [], instructors: [] });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const hasAnyResults = results && Object.values(results).some((list) => list.length > 0);

  function clearSearch() {
    setQuery('');
    setResults(null);
    setIsOpen(false);
  }

  function handleSelect(path) {
    if (!path) return;
    clearSearch();
    navigate(path);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      clearSearch();
      e.currentTarget.blur();
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label htmlFor="global-search" className="sr-only">
        Search courses, journeys, projects, skills, and instructors
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-soft" aria-hidden="true">
          ⌕
        </span>
        <input
          id="global-search"
          type="search"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search courses, journeys, projects..."
          className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-9 text-sm text-charcoal placeholder:text-charcoal-soft/70 focus:border-accent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-charcoal-soft hover:bg-cream-dim hover:text-charcoal"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="animate-fade-up absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-xl">
          {isLoading && <p className="px-2 py-4 text-sm text-charcoal-soft">Searching...</p>}
          {!isLoading && !hasAnyResults && (
            <p className="px-2 py-4 text-sm text-charcoal-soft">No results for "{query}". Try a different term.</p>
          )}
          {!isLoading && hasAnyResults && (
            <div className="flex flex-col gap-3">
              {CATEGORY_CONFIG.map(({ key, label, path }) => {
                const items = results[key] || [];
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">{label}</p>
                    <ul>
                      {items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(path(item))}
                            disabled={!path(item)}
                            className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-charcoal transition-colors hover:bg-cream-dim disabled:cursor-default disabled:opacity-70"
                          >
                            {item.title || item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
