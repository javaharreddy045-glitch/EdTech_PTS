import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { rows: userRows } = await query(
    `SELECT u.current_level, u.learning_preference, g.id AS goal_id, g.title AS goal_title, g.slug AS goal_slug
     FROM users u LEFT JOIN goals g ON g.id = u.current_goal_id WHERE u.id = $1`,
    [userId]
  );
  const profile = userRows[0];

  const { rows: userSkillRows } = await query(
    `SELECT s.id FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = $1`,
    [userId]
  );
  const skillIds = userSkillRows.map((s) => s.id);

  const { rows: activeJourneyRows } = await query(
    `SELECT j.id, j.title, j.slug, j.outcome,
            (SELECT COUNT(*)::int FROM journey_courses jc WHERE jc.journey_id = j.id) AS total_courses,
            (SELECT COUNT(*)::int FROM journey_courses jc JOIN enrollments e
               ON e.course_id = jc.course_id AND e.user_id = $1 AND e.status = 'completed'
             WHERE jc.journey_id = j.id) AS completed_courses
     FROM user_journeys uj JOIN learning_journeys j ON j.id = uj.journey_id
     WHERE uj.user_id = $1 AND uj.status = 'active' ORDER BY uj.started_at DESC LIMIT 1`,
    [userId]
  );
  const currentJourney = activeJourneyRows[0] || null;

  const { rows: continueLearning } = await query(
    `SELECT c.id, c.title, c.slug, c.image_url, e.progress_percent
     FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1 AND e.status = 'active'
     ORDER BY e.enrolled_at DESC LIMIT 1`,
    [userId]
  );

  const { rows: recommendedCourses } = await query(
    `SELECT c.id, c.title, c.slug, c.image_url, c.difficulty, c.duration_hours, c.rating_avg
     FROM courses c
     WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = $1 AND e.course_id = c.id)
     ORDER BY c.rating_avg DESC, c.learner_count DESC LIMIT 4`,
    [userId]
  );

  const { rows: recommendedProjects } = await query(
    `SELECT p.id, p.title, p.slug, p.image_url, p.difficulty, p.estimated_hours
     FROM projects p
     WHERE NOT EXISTS (SELECT 1 FROM user_projects up WHERE up.user_id = $1 AND up.project_id = p.id)
     ORDER BY p.title LIMIT 4`,
    [userId]
  );

  const { rows: similarJourneys } = await query(
    `SELECT j.id, j.title, j.slug, j.learner_label, j.outcome, j.duration_weeks,
            (CASE WHEN j.goal_id = $1 THEN 1 ELSE 0 END) AS goal_match,
            (SELECT COUNT(*)::int FROM journey_starting_skills jss WHERE jss.journey_id = j.id AND jss.skill_id = ANY($2)) AS skill_overlap,
            (SELECT COUNT(*)::int FROM journey_courses jc WHERE jc.journey_id = j.id) AS course_count,
            (SELECT COUNT(*)::int FROM journey_projects jp WHERE jp.journey_id = j.id) AS project_count
     FROM learning_journeys j
     ORDER BY goal_match DESC, skill_overlap DESC LIMIT 3`,
    [profile?.goal_id || null, skillIds.length ? skillIds : [0]]
  );

  for (const j of similarJourneys) {
    const { rows: chain } = await query(
      'SELECT title FROM journey_steps WHERE journey_id = $1 ORDER BY order_index',
      [j.id]
    );
    const { rows: startingSkills } = await query(
      `SELECT COALESCE(jss.label, s.name) AS label FROM journey_starting_skills jss JOIN skills s ON s.id = jss.skill_id WHERE jss.journey_id = $1`,
      [j.id]
    );
    j.stepChain = chain.map((c) => c.title);
    j.startingSkills = startingSkills.map((s) => s.label);
  }

  const { rows: recentActivity } = await query(
    `SELECT 'lesson_completed' AS kind, l.title AS label, lp.completed_at AS occurred_at
     FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
     WHERE lp.user_id = $1 AND lp.completed = true
     UNION ALL
     SELECT 'project_completed' AS kind, p.title AS label, up.completed_at AS occurred_at
     FROM user_projects up JOIN projects p ON p.id = up.project_id
     WHERE up.user_id = $1 AND up.status = 'completed'
     ORDER BY occurred_at DESC NULLS LAST LIMIT 6`,
    [userId]
  );

  let upcomingMilestone = null;
  if (currentJourney) {
    const remaining = currentJourney.total_courses - currentJourney.completed_courses;
    upcomingMilestone = remaining > 0
      ? `${remaining} course(s) left to finish "${currentJourney.title}"`
      : `All courses complete — finish remaining projects in "${currentJourney.title}"`;
  }

  const { rows: overallStats } = await query(
    `SELECT
       (SELECT COUNT(*) FILTER (WHERE status = 'completed')::int FROM enrollments WHERE user_id = $1) AS completed_courses,
       (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1) AS total_enrollments,
       (SELECT COUNT(*) FILTER (WHERE status = 'completed')::int FROM user_projects WHERE user_id = $1) AS completed_projects`,
    [userId]
  );
  const stats = overallStats[0];
  const overallProgress = currentJourney && currentJourney.total_courses > 0
    ? Math.round((currentJourney.completed_courses / currentJourney.total_courses) * 100)
    : 0;

  res.json({
    goal: profile?.goal_title || null,
    currentLevel: profile?.current_level || null,
    overallProgress,
    currentJourney,
    continueLearning: continueLearning[0] || null,
    recommendedCourses,
    recommendedProjects,
    similarJourneys,
    recentActivity,
    upcomingMilestone,
    stats,
  });
}));

export default router;
