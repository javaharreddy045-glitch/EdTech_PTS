import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { TextField } from '../components/TextField.jsx';
import { Button } from '../components/Button.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(form.email, form.password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not log in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Welcome back</h1>
      <p className="mt-1.5 text-sm text-charcoal-soft">Log in to continue your learning path.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-accent-dark hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal-soft">
        New to PathToSkill?{' '}
        <Link to="/signup" className="font-medium text-accent-dark hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-border bg-cream-dim/50 p-3 text-xs text-charcoal-soft">
        Demo account — email: <span className="font-medium text-charcoal">demo@pathtoskill.com</span>, password:{' '}
        <span className="font-medium text-charcoal">Password123!</span>
      </div>
    </div>
  );
}
