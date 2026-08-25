import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GlobalSearch } from './GlobalSearch.jsx';
import { NotificationBell } from './NotificationBell.jsx';

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-cream/90 px-4 py-3 backdrop-blur sm:px-6">
      <NavLink to="/dashboard" className="hidden font-display text-lg font-semibold text-charcoal sm:block lg:hidden">
        PathToSkill
      </NavLink>
      <div className="flex-1 sm:max-w-sm">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <NavLink to="/profile" className="hidden rounded-full px-3 py-2 text-sm font-medium text-charcoal-soft hover:text-charcoal sm:block">
          {user?.name?.split(' ')[0] || 'Profile'}
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="hidden rounded-full border border-border px-3 py-2 text-sm font-medium text-charcoal-soft transition-colors hover:border-accent hover:text-accent-dark sm:block"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
