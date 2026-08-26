import { useState } from 'react';

export function TextField({ label, id, error, className = '', type = 'text', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          className={`w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal-soft/60 focus:border-accent focus:outline-none ${
            isPassword ? 'pr-11' : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-charcoal-soft transition-colors hover:bg-cream-dim hover:text-charcoal"
          >
            <span aria-hidden="true">{showPassword ? '🙈' : '👁'}</span>
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
