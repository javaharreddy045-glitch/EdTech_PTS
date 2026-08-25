import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT id, type, title, message, is_read, related_entity_type, related_entity_id, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  const unreadCount = rows.filter((n) => !n.is_read).length;
  res.json({ notifications: rows, unreadCount });
}));

router.post('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) throw notFound('Notification not found.');
  res.json({ message: 'Marked as read.' });
}));

router.post('/read-all', requireAuth, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [req.user.id]);
  res.json({ message: 'All notifications marked as read.' });
}));

export default router;
