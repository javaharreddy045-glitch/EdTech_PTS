import { ApiError } from '../utils/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'That value already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Related record not found.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on our end.' });
}
