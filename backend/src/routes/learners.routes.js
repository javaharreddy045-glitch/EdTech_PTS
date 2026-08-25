import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';

const router = Router();

// Shared shape for a demo learner card/profile: journey-first, person second. Never exposes
// anything beyond first name, avatar, and learning data - no age, location, or real contact info.
async function buildLearnerSummary(userRow) {
  const { rows: journeyRows } = await query(
    `SELECT j.id, j.title, j.slug, j.outcome, g.title AS goal_title
     FROM user_journeys uj JOIN learning_journeys j ON j.id = uj.journey_id
     JOIN goals g ON g.id = j.goal_id
     WHERE uj.user_id = $1 ORDER BY uj.started_at DESC LIMIT 1`,
    [userRow.id]
  );
  const journey = journeyRows[0];
  if (!journey) return null;

  const [{ rows: startingSkills }, { rows: skillsGained }, { rows: stats }] = await Promise.all([
    query(
      `SELECT COALESCE(jss.label, s.name) AS label FROM journey_starting_skills jss
       JOIN skills s ON s.id = jss.skill_id WHERE jss.journey_id = $1`,
      [journey.id]
    ),
    query(
      `SELECT s.name FROM journey_skills_gained jsg JOIN skills s ON s.id = jsg.skill_id
       WHERE jsg.journey_id = $1 ORDER BY jsg.order_index`,
      [journey.id]
    ),
    query(
      `SELECT
         (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1 AND status = 'completed') AS courses_completed,
         (SELECT COUNT(*)::int FROM user_projects WHERE user_id = $1 AND status = 'completed') AS projects_completed`,
      [userRow.id]
    ),
  ]);

  return {
    id: userRow.id,
    name: userRow.name,
    avatarUrl: userRow.avatar_url,
    contactEmail: userRow.email,
    goalTitle: journey.goal_title,
    startingSkillLabel: startingSkills.map((s) => s.label).join(', '),
    currentLevel: userRow.current_level,
    coursesCompleted: stats[0].courses_completed,
    projectsCompleted: stats[0].projects_completed,
    skillsGained: skillsGained.map((s) => s.name),
    currentPathTitle: journey.title,
    journeySlug: journey.slug,
    outcome: journey.outcome,
  };
}

router.get('/similar', requireAuth, asyncHandler(async (req, res) => {
  const { rows: profileRows } = await query(
    `SELECT current_goal_id, current_level FROM users WHERE id = $1`,
    [req.user.id]
  );
  const profile = profileRows[0];

  const { rows: userSkillRows } = await query(
    `SELECT s.id FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = $1`,
    [req.user.id]
  );
  const skillIds = userSkillRows.map((s) => s.id);

  const { rows: candidateUsers } = await query(
    `SELECT u.id, u.name, u.avatar_url, u.email, u.current_level,
            (CASE WHEN j.goal_id = $1 THEN 1 ELSE 0 END) AS goal_match,
            (SELECT COUNT(*)::int FROM journey_starting_skills jss WHERE jss.journey_id = j.id AND jss.skill_id = ANY($2)) AS skill_overlap
     FROM users u
     JOIN user_journeys uj ON uj.user_id = u.id
     JOIN learning_journeys j ON j.id = uj.journey_id
     WHERE u.is_demo_profile = true AND u.id != $3
     ORDER BY goal_match DESC, skill_overlap DESC LIMIT 3`,
    [profile?.current_goal_id || null, skillIds.length ? skillIds : [0], req.user.id]
  );

  const learners = (await Promise.all(candidateUsers.map(buildLearnerSummary))).filter(Boolean);
  res.json({ learners });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, avatar_url, email, current_level FROM users WHERE id = $1 AND is_demo_profile = true',
    [req.params.id]
  );
  if (rows.length === 0) throw notFound('Learner profile not found.');

  const summary = await buildLearnerSummary(rows[0]);
  if (!summary) throw notFound('Learner profile not found.');

  res.json({ learner: summary });
}));

export default router;
