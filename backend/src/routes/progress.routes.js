import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    { rows: courseStats },
    { rows: projectStats },
    { rows: skillStats },
    { rows: activeJourney },
    { rows: hoursRows },
    { rows: recentActivity },
  ] = await Promise.all([
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
              COUNT(*)::int AS total
       FROM enrollments WHERE user_id = $1`,
      [userId]
    ),
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
              COUNT(*)::int AS total
       FROM user_projects WHERE user_id = $1`,
      [userId]
    ),
    query('SELECT COUNT(*)::int AS total FROM user_skills WHERE user_id = $1', [userId]),
    query(
      `SELECT j.id, j.title, j.slug, uj.started_at,
              (SELECT COUNT(*)::int FROM journey_courses jc WHERE jc.journey_id = j.id) AS total_courses,
              (SELECT COUNT(*)::int FROM journey_courses jc JOIN enrollments e
                 ON e.course_id = jc.course_id AND e.user_id = $1 AND e.status = 'completed'
               WHERE jc.journey_id = j.id) AS completed_courses
       FROM user_journeys uj JOIN learning_journeys j ON j.id = uj.journey_id
       WHERE uj.user_id = $1 AND uj.status = 'active'
       ORDER BY uj.started_at DESC LIMIT 1`,
      [userId]
    ),
    query(
      `SELECT COALESCE(SUM(l.duration_minutes), 0)::int AS minutes
       FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
       WHERE lp.user_id = $1 AND lp.completed = true`,
      [userId]
    ),
    query(
      `SELECT 'lesson' AS kind, l.title AS label, lp.completed_at AS occurred_at
       FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
       WHERE lp.user_id = $1 AND lp.completed = true
       UNION ALL
       SELECT 'project' AS kind, p.title AS label, up.completed_at AS occurred_at
       FROM user_projects up JOIN projects p ON p.id = up.project_id
       WHERE up.user_id = $1 AND up.status = 'completed'
       ORDER BY occurred_at DESC NULLS LAST LIMIT 8`,
      [userId]
    ),
  ]);

  let nextMilestone = null;
  if (activeJourney.length > 0) {
    const j = activeJourney[0];
    if (j.completed_courses < j.total_courses) {
      nextMilestone = `Complete ${j.total_courses - j.completed_courses} more course(s) in "${j.title}"`;
    } else {
      nextMilestone = `Finish the remaining projects in "${j.title}"`;
    }
  }

  const learningHours = Math.round((hoursRows[0].minutes / 60) * 10) / 10;

  // Streak approximation: distinct recent days with completed activity, counted back from today.
  const { rows: activityDays } = await query(
    `SELECT DISTINCT date_trunc('day', occurred_at) AS day FROM (
       SELECT completed_at AS occurred_at FROM lesson_progress WHERE user_id = $1 AND completed = true
       UNION ALL
       SELECT completed_at AS occurred_at FROM user_projects WHERE user_id = $1 AND completed_at IS NOT NULL
     ) activity
     WHERE occurred_at IS NOT NULL
     ORDER BY day DESC`,
    [userId]
  );
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const row of activityDays) {
    const day = new Date(row.day);
    day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((cursor - day) / (24 * 60 * 60 * 1000));
    if (diffDays === streak) {
      streak += 1;
    } else if (diffDays > streak) {
      break;
    }
  }

  res.json({
    coursesCompleted: courseStats[0].completed,
    coursesInProgress: courseStats[0].total - courseStats[0].completed,
    projectsCompleted: projectStats[0].completed,
    skillsGained: skillStats[0].total,
    learningHours,
    learningStreakDays: streak,
    currentJourney: activeJourney[0] || null,
    nextMilestone,
    recentActivity,
  });
}));

export default router;
