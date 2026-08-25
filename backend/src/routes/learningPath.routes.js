import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';

const router = Router();

async function buildJourneyPath(userId, journey) {
  const { rows: courseSteps } = await query(
    `SELECT jc.order_index, 'course' AS type, c.id, c.title, c.slug, c.duration_hours,
            COALESCE(e.status, 'not_started') AS status, COALESCE(e.progress_percent, 0) AS progress_percent
     FROM journey_courses jc
     JOIN courses c ON c.id = jc.course_id
     LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
     WHERE jc.journey_id = $2`,
    [userId, journey.id]
  );
  const { rows: projectSteps } = await query(
    `SELECT jp.order_index, 'project' AS type, p.id, p.title, p.slug, p.estimated_hours AS duration_hours,
            COALESCE(up.status, 'not_started') AS status, COALESCE(up.progress_percent, 0) AS progress_percent
     FROM journey_projects jp
     JOIN projects p ON p.id = jp.project_id
     LEFT JOIN user_projects up ON up.project_id = p.id AND up.user_id = $1
     WHERE jp.journey_id = $2`,
    [userId, journey.id]
  );

  // Projects are placed after all courses in the sequence (matches the seeded journey structure).
  const steps = [...courseSteps.sort((a, b) => a.order_index - b.order_index), ...projectSteps.sort((a, b) => a.order_index - b.order_index)];

  const total = steps.length;
  const completed = steps.filter((s) => s.status === 'completed').length;
  const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextStep = steps.find((s) => s.status !== 'completed') || null;
  const totalCourses = courseSteps.length;
  const completedCourses = courseSteps.filter((s) => s.status === 'completed').length;

  return { journey, steps, overallProgress, nextStep, totalCourses, completedCourses };
}

// A learner can follow multiple journeys at once - following a new one never removes
// or deactivates an existing one, so this returns every journey currently being followed.
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows: journeyRows } = await query(
    `SELECT j.id, j.title, j.slug, j.outcome, j.description, uj.started_at
     FROM user_journeys uj JOIN learning_journeys j ON j.id = uj.journey_id
     WHERE uj.user_id = $1 AND uj.status = 'active'
     ORDER BY uj.started_at DESC`,
    [req.user.id]
  );

  const paths = await Promise.all(journeyRows.map((journey) => buildJourneyPath(req.user.id, journey)));

  res.json({ paths });
}));

router.post('/skip/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id FROM courses WHERE id = $1', [req.params.courseId]);
  if (rows.length === 0) throw notFound('Course not found.');

  await query(
    `INSERT INTO enrollments (user_id, course_id, status, progress_percent, completed_at)
     VALUES ($1, $2, 'completed', 100, now())
     ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'completed', progress_percent = 100, completed_at = now()`,
    [req.user.id, req.params.courseId]
  );
  await query(
    `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
     SELECT $1, id, true, now() FROM lessons WHERE course_id = $2
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = now()`,
    [req.user.id, req.params.courseId]
  );

  res.json({ message: 'Marked as already known and skipped.' });
}));

export default router;
