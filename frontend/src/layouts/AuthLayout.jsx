import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="px-4 py-6 sm:px-8">
        <Link to="/" className="font-display text-lg font-semibold text-charcoal">
          PathToSkill
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
