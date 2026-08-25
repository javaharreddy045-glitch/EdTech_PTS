import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GlobalSearch } from './GlobalSearch.jsx';
import { NotificationBell } from './NotificationBell.jsx';

const PUBLIC_NAV_LINKS = [
  { to: '/journeys', label: 'Journeys' },
  { to: '/courses', label: 'Courses' },
  { to: '/projects', label: 'Projects' },
  { to: '/assessments', label: 'Assessments' },
];

const AUTHENTICATED_NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  ...PUBLIC_NAV_LINKS,
  { to: '/progress', label: 'Progress' },
];

function navLinkClass({ isActive }) {
  return `rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
    isActive ? 'bg-accent-soft text-accent-dark' : 'text-charcoal-soft hover:text-charcoal'
  }`;
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate('/');
  }

  const navLinks = isAuthenticated ? AUTHENTICATED_NAV_LINKS : PUBLIC_NAV_LINKS;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6" aria-label="Primary">
        <NavLink to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
          <span className="font-display text-lg font-semibold text-charcoal">PathToSkill</span>
        </NavLink>

        <div className="hidden flex-1 lg:block lg:max-w-xs">
          <GlobalSearch />
        </div>
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <NavLink to="/profile" className="rounded-full px-3 py-2 text-sm font-medium text-charcoal-soft hover:text-charcoal">
                {user?.name?.split(' ')[0] || 'Profile'}
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-border px-3 py-2 text-sm font-medium text-charcoal-soft transition-colors hover:border-accent hover:text-accent-dark"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-charcoal-soft hover:text-charcoal">
                Log in
              </NavLink>
              <NavLink to="/signup" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
                Sign up
              </NavLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto rounded-full p-2 text-charcoal lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span aria-hidden="true" className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
        </button>
      </nav>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-border bg-cream transition-[max-height] duration-300 ease-out lg:hidden ${
          mobileOpen ? 'max-h-[32rem]' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-3 px-4 py-4">
          <GlobalSearch />
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={() => setMobileOpen(false)}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {isAuthenticated ? (
              <>
                <NavLink to="/notifications" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  Notifications
                </NavLink>
                <NavLink to="/profile" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  Profile
                </NavLink>
                <button type="button" onClick={handleLogout} className="rounded-full border border-border px-3 py-2 text-left text-sm font-medium text-charcoal-soft">
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  Log in
                </NavLink>
                <NavLink to="/signup" className="rounded-full bg-accent px-4 py-2 text-center text-sm font-medium text-white" onClick={() => setMobileOpen(false)}>
                  Sign up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
