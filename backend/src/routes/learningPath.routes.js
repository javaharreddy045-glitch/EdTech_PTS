import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';
import { getJourneyTimeline } from '../utils/journeyTimeline.js';

const router = Router();

async function buildJourneyPath(userId, journey) {
  const steps = await getJourneyTimeline(userId, journey.id);

  const total = steps.length;
  const completed = steps.filter((s) => s.status === 'completed').length;
  const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextStep = steps.find((s) => s.status !== 'completed') || null;
  const totalCourses = steps.filter((s) => s.type === 'course').length;
  const completedCourses = steps.filter((s) => s.type === 'course' && s.status === 'completed').length;
  const projectCount = steps.filter((s) => s.type === 'project').length;

  return {
    journey: { ...journey, courseCount: totalCourses, projectCount, isFollowing: true },
    steps,
    overallProgress,
    nextStep,
    totalCourses,
    completedCourses,
  };
}

// A learner can follow multiple journeys at once - following a new one never removes
// or deactivates an existing one, so this returns every journey currently being followed.
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows: journeyRows } = await query(
    `SELECT j.id, j.title, j.slug, j.outcome, j.description, j.duration_weeks,
            g.title AS goal_title, g.slug AS goal_slug, uj.started_at
     FROM user_journeys uj JOIN learning_journeys j ON j.id = uj.journey_id
     JOIN goals g ON g.id = j.goal_id
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
