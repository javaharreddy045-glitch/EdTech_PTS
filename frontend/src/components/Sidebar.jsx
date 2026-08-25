import { NavLink } from 'react-router-dom';

const PRIMARY_LINKS = [
  { to: '/dashboard', label: 'Home', end: true },
  { to: '/journeys', label: 'Explore Paths', emphasize: true },
  { to: '/learning-path', label: 'My Paths', emphasize: true },
];

const SUPPORTING_LINKS = [
  { to: '/courses', label: 'Courses' },
  { to: '/projects', label: 'Projects' },
  { to: '/assessments', label: 'Assessments' },
  { to: '/progress', label: 'Progress' },
];

const SECONDARY_LINKS = [
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

function linkClass({ isActive }, emphasize) {
  const base = 'block rounded-full px-4 py-2 text-sm transition-colors duration-200';
  if (isActive) return `${base} bg-accent-soft text-accent-dark font-medium`;
  return `${base} text-charcoal-soft hover:bg-cream-dim hover:text-charcoal ${emphasize ? 'font-medium text-charcoal' : ''}`;
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-cream px-4 py-6 lg:flex">
      <NavLink to="/dashboard" className="px-2 font-display text-lg font-semibold text-charcoal">
        PathToSkill
      </NavLink>

      <nav className="mt-8 flex flex-1 flex-col gap-6" aria-label="Primary">
        <div className="flex flex-col gap-1">
          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={(state) => linkClass(state, link.emphasize)}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-4">
          {SUPPORTING_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={(state) => linkClass(state)}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
          {SECONDARY_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={(state) => linkClass(state)}>
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
