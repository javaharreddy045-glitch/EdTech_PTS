import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'bg-white text-charcoal border border-border hover:border-accent hover:text-accent-dark',
  ghost: 'text-charcoal-soft hover:text-charcoal hover:bg-cream-dim',
  danger: 'bg-danger text-white hover:opacity-90',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', to, as, children, disabled, ...props }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  const Component = as || 'button';
  return (
    <Component className={classes} disabled={disabled} {...props}>
      {children}
    </Component>
  );
}
