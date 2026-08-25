import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/endpoints.js';
import { TextField } from '../components/TextField.jsx';
import { Button } from '../components/Button.jsx';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const data = await authApi.forgotPassword(email);
      setMessage(data.message);
      if (data.devResetToken) setDevToken(data.devResetToken);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Reset your password</h1>
      <p className="mt-1.5 text-sm text-charcoal-soft">Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {message && (
          <div role="status" className="rounded-xl border border-border bg-accent-soft/50 p-3 text-sm text-accent-dark">
            <p>{message}</p>
            {devToken && (
              <p className="mt-2 text-xs">
                Development mode — no email server configured. Use this token on the{' '}
                <Link to="/reset-password" className="font-medium underline">
                  reset password page
                </Link>
                : <span className="break-all font-mono">{devToken}</span>
              </p>
            )}
          </div>
        )}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal-soft">
        Remembered your password?{' '}
        <Link to="/login" className="font-medium text-accent-dark hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
