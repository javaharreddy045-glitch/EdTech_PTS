export function RatingStars({ rating = 0, count, size = 'sm' }) {
  const rounded = Math.round(Number(rating) * 2) / 2;
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass}`} aria-label={`Rated ${rating} out of 5`}>
      <span className="text-warn" aria-hidden="true">
        {'★'.repeat(Math.floor(rounded))}
        {rounded % 1 !== 0 ? '½' : ''}
        {'☆'.repeat(5 - Math.ceil(rounded))}
      </span>
      <span className="text-charcoal-soft">{Number(rating).toFixed(1)}</span>
      {count !== undefined && <span className="text-charcoal-soft">({count})</span>}
    </span>
  );
}
