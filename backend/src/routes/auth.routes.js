import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireFields, assertValidEmail, assertValidPassword } from '../utils/validators.js';
import { badRequest, unauthorized } from '../utils/errors.js';
import { signToken } from '../utils/jwt.js';
import { generateResetToken, hashResetToken } from '../utils/resetToken.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function sanitizeUser(user) {
  const { password_hash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

router.post('/signup', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  requireFields(req.body, ['name', 'email', 'password']);
  assertValidEmail(email);
  assertValidPassword(password);

  const normalizedEmail = email.trim().toLowerCase();
  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.length > 0) throw badRequest('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, avatar_url, bio, current_goal_id, current_level, learning_preference, onboarding_completed, role, created_at`,
    [name.trim(), normalizedEmail, passwordHash]
  );
  const user = rows[0];
  const token = signToken(user);
  res.status(201).json({ token, user: sanitizeUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  requireFields(req.body, ['email', 'password']);

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  if (rows.length === 0) throw unauthorized('Invalid email or password.');

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw unauthorized('Invalid email or password.');

  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.avatar_url, u.bio, u.current_level, u.learning_preference,
            u.onboarding_completed, u.role, u.created_at,
            g.id AS goal_id, g.title AS goal_title, g.slug AS goal_slug
     FROM users u
     LEFT JOIN goals g ON g.id = u.current_goal_id
     WHERE u.id = $1`,
    [req.user.id]
  );
  res.json({ user: rows[0] });
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  requireFields(req.body, ['email']);
  const normalizedEmail = email.trim().toLowerCase();

  const { rows } = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

  // Always respond the same way so we don't reveal whether an email is registered.
  const genericResponse = { message: 'If an account exists for that email, a password reset link has been sent.' };

  if (rows.length === 0) {
    return res.json(genericResponse);
  }

  const userId = rows[0].id;
  const { rawToken, tokenHash } = generateResetToken();
  const expiresMinutes = parseInt(process.env.RESET_TOKEN_EXPIRES_MINUTES || '30', 10);
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

  await query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = false', [userId]);
  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
  const { sent } = await sendPasswordResetEmail(normalizedEmail, resetUrl);

  // Always log server-side too, and fall back to echoing the token outside production if the
  // email couldn't be sent (e.g. RESEND_API_KEY not configured yet in local development).
  console.log(`[password reset] token for ${normalizedEmail}: ${rawToken} (expires ${expiresAt.toISOString()})`);

  if (!sent && process.env.NODE_ENV !== 'production') {
    genericResponse.devResetToken = rawToken;
  }
  res.json(genericResponse);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  requireFields(req.body, ['token', 'password']);
  assertValidPassword(password);

  const tokenHash = hashResetToken(token);
  const { rows } = await query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used = false AND expires_at > now()`,
    [tokenHash]
  );
  if (rows.length === 0) throw badRequest('This reset link is invalid or has expired.');

  const resetRecord = rows[0];
  const passwordHash = await bcrypt.hash(password, 10);

  await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, resetRecord.user_id]);
  await query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [resetRecord.id]);
  await query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = false', [resetRecord.user_id]);

  res.json({ message: 'Your password has been reset. You can now log in.' });
}));

export default router;
