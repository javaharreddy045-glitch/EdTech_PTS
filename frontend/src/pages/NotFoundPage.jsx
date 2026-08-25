import { Button } from '../components/Button.jsx';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-5xl text-charcoal">404</p>
      <h1 className="mt-3 font-display text-xl text-charcoal">Page not found</h1>
      <p className="mt-2 text-sm text-charcoal-soft">The page you're looking for doesn't exist or has moved.</p>
      <Button to="/" className="mt-6">Back to home</Button>
    </div>
  );
}
