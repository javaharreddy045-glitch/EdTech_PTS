import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/endpoints.js';
import { TextField } from '../components/TextField.jsx';
import { Button } from '../components/Button.jsx';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Could not reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Set a new password</h1>
      <p className="mt-1.5 text-sm text-charcoal-soft">Paste the reset token you received and choose a new password.</p>

      {success ? (
        <p role="status" className="mt-6 rounded-xl border border-border bg-accent-soft/50 p-3 text-sm text-accent-dark">
          Your password has been reset. Redirecting to log in...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <TextField
            id="token"
            label="Reset token"
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <TextField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-charcoal-soft">
        <Link to="/login" className="font-medium text-accent-dark hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
