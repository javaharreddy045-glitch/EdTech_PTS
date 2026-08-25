import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, forbidden } from '../utils/errors.js';

const router = Router();

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT l.*, c.title AS course_title, c.slug AS course_slug, c.id AS course_id
     FROM lessons l JOIN courses c ON c.id = l.course_id WHERE l.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw notFound('Lesson not found.');
  const lesson = rows[0];

  const { rows: enrollRows } = await query(
    'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [req.user.id, lesson.course_id]
  );
  if (enrollRows.length === 0) throw forbidden('Enroll in this course to access its lessons.');

  const { rows: allLessons } = await query(
    'SELECT id, title, order_index FROM lessons WHERE course_id = $1 ORDER BY order_index',
    [lesson.course_id]
  );
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = allLessons[currentIndex + 1] || null;

  const { rows: progressRows } = await query(
    'SELECT completed FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2',
    [req.user.id, lesson.id]
  );

  res.json({
    lesson,
    completed: progressRows[0]?.completed || false,
    nextLesson,
    totalLessons: allLessons.length,
    currentPosition: currentIndex + 1,
  });
}));

router.post('/:id/complete', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM lessons WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw notFound('Lesson not found.');
  const lesson = rows[0];

  const { rows: enrollRows } = await query(
    'SELECT id, status FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [req.user.id, lesson.course_id]
  );
  if (enrollRows.length === 0) throw forbidden('Enroll in this course to track progress.');

  await query(
    `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
     VALUES ($1, $2, true, now())
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = now()`,
    [req.user.id, lesson.id]
  );

  const { rows: totals } = await query(
    `SELECT
       (SELECT COUNT(*) FROM lessons WHERE course_id = $1) AS total,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
          WHERE lp.user_id = $2 AND l.course_id = $1 AND lp.completed = true) AS completed`,
    [lesson.course_id, req.user.id]
  );
  const { total, completed } = totals[0];
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isCourseComplete = progressPercent >= 100;

  await query(
    `UPDATE enrollments SET progress_percent = $1, status = $2, completed_at = $3
     WHERE user_id = $4 AND course_id = $5`,
    [progressPercent, isCourseComplete ? 'completed' : 'active', isCourseComplete ? new Date() : null, req.user.id, lesson.course_id]
  );

  if (isCourseComplete) {
    const { rows: courseRows } = await query('SELECT title FROM courses WHERE id = $1', [lesson.course_id]);
    await query(
      `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
       VALUES ($1, 'course_completion', 'Course completed', $2, 'course', $3)`,
      [req.user.id, `You completed "${courseRows[0].title}". Great progress!`, lesson.course_id]
    );
  }

  res.json({ progressPercent, isCourseComplete });
}));

export default router;
