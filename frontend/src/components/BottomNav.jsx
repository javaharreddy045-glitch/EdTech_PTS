import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Modal } from './Modal.jsx';

const PRIMARY_ITEMS = [
  { to: '/dashboard', label: 'Home', end: true },
  { to: '/journeys', label: 'Paths' },
  { to: '/learning-path', label: 'My Learning' },
];

const MORE_ITEMS = [
  { to: '/courses', label: 'Courses' },
  { to: '/projects', label: 'Projects' },
  { to: '/assessments', label: 'Assessments' },
  { to: '/progress', label: 'Progress' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

function itemClass({ isActive }) {
  return `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
    isActive ? 'text-accent-dark' : 'text-charcoal-soft'
  }`;
}

export function BottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-cream/95 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        {PRIMARY_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
            {item.label}
          </NavLink>
        ))}
        <button type="button" onClick={() => setIsMoreOpen(true)} className="flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-charcoal-soft">
          More
        </button>
      </nav>

      <Modal isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} title="More">
        <ul className="flex flex-col gap-1">
          {MORE_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setIsMoreOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-cream-dim"
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
