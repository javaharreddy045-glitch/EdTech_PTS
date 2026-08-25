import { badRequest } from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    throw badRequest(`Missing required field(s): ${missing.join(', ')}`);
  }
}

export function assertValidEmail(email) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    throw badRequest('Please provide a valid email address.');
  }
}

export function assertValidPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw badRequest('Password must be at least 8 characters long.');
  }
}

export function assertOneOf(value, allowed, fieldName) {
  if (!allowed.includes(value)) {
    throw badRequest(`Invalid value for ${fieldName}. Must be one of: ${allowed.join(', ')}`);
  }
}

export function toPositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
