import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFields } from '../utils/validators.js';
import { notFound } from '../utils/errors.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT e.id, e.status, e.progress_percent, e.enrolled_at, e.completed_at,
            c.id AS course_id, c.title, c.slug, c.image_url, c.duration_hours, c.difficulty, c.category
     FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC`,
    [req.user.id]
  );
  res.json({ enrollments: rows });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  requireFields(req.body, ['courseId']);

  const { rows: courseRows } = await query('SELECT id, title FROM courses WHERE id = $1', [courseId]);
  if (courseRows.length === 0) throw notFound('Course not found.');

  const { rows } = await query(
    `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)
     ON CONFLICT (user_id, course_id) DO NOTHING
     RETURNING id, status, progress_percent, enrolled_at`,
    [req.user.id, courseId]
  );

  if (rows.length === 0) {
    const { rows: existing } = await query(
      'SELECT id, status, progress_percent, enrolled_at FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );
    return res.json({ enrollment: existing[0], alreadyEnrolled: true });
  }

  res.status(201).json({ enrollment: rows[0], alreadyEnrolled: false });
}));

export default router;
