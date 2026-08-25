import { verifyToken } from '../utils/jwt.js';
import { unauthorized } from '../utils/errors.js';
import { query } from '../config/db.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized('Please log in to continue.');

    const payload = verifyToken(token);
    const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1', [payload.sub]);
    if (rows.length === 0) throw unauthorized('Account no longer exists.');

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(unauthorized('Your session has expired. Please log in again.'));
    }
    next(err);
  }
}

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1', [payload.sub]);
    if (rows.length > 0) req.user = rows[0];
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
