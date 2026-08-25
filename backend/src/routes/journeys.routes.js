import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';
import { getJourneyCourseStatuses } from '../utils/journeyCourseAccess.js';

const router = Router();

const SORT_MAP = {
  duration_asc: 'j.duration_weeks ASC',
  duration_desc: 'j.duration_weeks DESC',
  newest: 'j.created_at DESC',
  alphabetical: 'j.title ASC',
};

async function attachJourneySummaries(journeyRows) {
  const ids = journeyRows.map((j) => j.id);
  if (ids.length === 0) return [];

  const { rows: courseCounts } = await query(
    `SELECT journey_id, COUNT(*)::int AS count FROM journey_courses WHERE journey_id = ANY($1) GROUP BY journey_id`,
    [ids]
  );
  const { rows: projectCounts } = await query(
    `SELECT journey_id, COUNT(*)::int AS count FROM journey_projects WHERE journey_id = ANY($1) GROUP BY journey_id`,
    [ids]
  );
  const { rows: startingSkills } = await query(
    `SELECT jss.journey_id, jss.label, s.name FROM journey_starting_skills jss
     JOIN skills s ON s.id = jss.skill_id WHERE jss.journey_id = ANY($1)`,
    [ids]
  );
  const { rows: skillChain } = await query(
    `SELECT journey_id, order_index, title FROM journey_steps WHERE journey_id = ANY($1) ORDER BY order_index`,
    [ids]
  );

  const courseCountMap = Object.fromEntries(courseCounts.map((r) => [r.journey_id, r.count]));
  const projectCountMap = Object.fromEntries(projectCounts.map((r) => [r.journey_id, r.count]));
  const startingSkillsMap = {};
  for (const row of startingSkills) {
    (startingSkillsMap[row.journey_id] ||= []).push(row.label || row.name);
  }
  const chainMap = {};
  for (const row of skillChain) {
    (chainMap[row.journey_id] ||= []).push(row.title);
  }

  return journeyRows.map((j) => ({
    ...j,
    courseCount: courseCountMap[j.id] || 0,
    projectCount: projectCountMap[j.id] || 0,
    startingSkills: startingSkillsMap[j.id] || [],
    stepChain: chainMap[j.id] || [],
  }));
}

router.get('/', asyncHandler(async (req, res) => {
  const { search, goal, level, skill, minDuration, maxDuration, outcome, sort } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`);
  }
  if (goal) {
    params.push(goal);
    conditions.push(`g.slug = $${params.length}`);
  }
  if (level) {
    params.push(level);
    conditions.push(`j.starting_level = $${params.length}`);
  }
  if (outcome) {
    params.push(`%${outcome}%`);
    conditions.push(`j.outcome ILIKE $${params.length}`);
  }
  if (minDuration) {
    params.push(Number(minDuration));
    conditions.push(`j.duration_weeks >= $${params.length}`);
  }
  if (maxDuration) {
    params.push(Number(maxDuration));
    conditions.push(`j.duration_weeks <= $${params.length}`);
  }
  if (skill) {
    params.push(skill);
    conditions.push(`(
      EXISTS (SELECT 1 FROM journey_starting_skills jss JOIN skills s ON s.id = jss.skill_id WHERE jss.journey_id = j.id AND s.slug = $${params.length})
      OR EXISTS (SELECT 1 FROM journey_skills_gained jsg JOIN skills s ON s.id = jsg.skill_id WHERE jsg.journey_id = j.id AND s.slug = $${params.length})
    )`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = SORT_MAP[sort] || 'j.title ASC';

  const { rows } = await query(
    `SELECT j.id, j.title, j.slug, j.learner_label, j.starting_level, j.outcome, j.duration_weeks, j.description,
            g.title AS goal_title, g.slug AS goal_slug
     FROM learning_journeys j JOIN goals g ON g.id = j.goal_id
     ${where}
     ORDER BY ${orderBy}`,
    params
  );

  const journeys = await attachJourneySummaries(rows);
  res.json({ journeys });
}));

router.get('/similar', requireAuth, asyncHandler(async (req, res) => {
  const { rows: userRows } = await query(
    `SELECT u.current_level, u.current_goal_id, g.title AS goal_title
     FROM users u LEFT JOIN goals g ON g.id = u.current_goal_id WHERE u.id = $1`,
    [req.user.id]
  );
  const user = userRows[0];

  const { rows: userSkills } = await query(
    `SELECT s.id FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = $1`,
    [req.user.id]
  );
  const skillIds = userSkills.map((s) => s.id);

  // Rank by: same goal first, then overlapping starting skills, then same starting level.
  const { rows: candidates } = await query(
    `SELECT j.id, j.title, j.slug, j.learner_label, j.starting_level, j.outcome, j.duration_weeks, j.description,
            g.title AS goal_title, g.slug AS goal_slug,
            (CASE WHEN j.goal_id = $1 THEN 1 ELSE 0 END) AS goal_match,
            (CASE WHEN j.starting_level = $2 THEN 1 ELSE 0 END) AS level_match,
            (SELECT COUNT(*)::int FROM journey_starting_skills jss WHERE jss.journey_id = j.id AND jss.skill_id = ANY($3)) AS skill_overlap
     FROM learning_journeys j JOIN goals g ON g.id = j.goal_id
     ORDER BY goal_match DESC, skill_overlap DESC, level_match DESC
     LIMIT 5`,
    [user?.current_goal_id || null, user?.current_level || null, skillIds.length ? skillIds : [0]]
  );

  const journeys = await attachJourneySummaries(candidates);
  res.json({ journeys });
}));

router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT j.*, g.title AS goal_title, g.slug AS goal_slug
     FROM learning_journeys j JOIN goals g ON g.id = j.goal_id
     WHERE j.slug = $1`,
    [req.params.slug]
  );
  if (rows.length === 0) throw notFound('Journey not found.');
  const journey = rows[0];

  const [
    { rows: startingSkills },
    { rows: skillsGained },
    { rows: steps },
    { rows: journeyCourses },
    { rows: journeyProjects },
  ] = await Promise.all([
    query(
      `SELECT s.id, s.name, jss.label FROM journey_starting_skills jss JOIN skills s ON s.id = jss.skill_id WHERE jss.journey_id = $1`,
      [journey.id]
    ),
    query(
      `SELECT s.id, s.name FROM journey_skills_gained jsg JOIN skills s ON s.id = jsg.skill_id
       WHERE jsg.journey_id = $1 ORDER BY jsg.order_index`,
      [journey.id]
    ),
    query('SELECT id, order_index, phase, title FROM journey_steps WHERE journey_id = $1 ORDER BY order_index', [journey.id]),
    query(
      `SELECT jc.order_index, c.id, c.title, c.slug, c.description, c.difficulty, c.duration_hours, c.image_url
       FROM journey_courses jc JOIN courses c ON c.id = jc.course_id WHERE jc.journey_id = $1 ORDER BY jc.order_index`,
      [journey.id]
    ),
    query(
      `SELECT jp.order_index, p.id, p.title, p.slug, p.description, p.difficulty, p.estimated_hours, p.image_url
       FROM journey_projects jp JOIN projects p ON p.id = jp.project_id WHERE jp.journey_id = $1 ORDER BY jp.order_index`,
      [journey.id]
    ),
  ]);

  const courseStatuses = await getJourneyCourseStatuses(req.user?.id, journey.id);
  const statusByCourseId = new Map(courseStatuses.map((c) => [c.id, c]));
  const journeyCoursesWithStatus = journeyCourses.map((c) => ({
    ...c,
    status: statusByCourseId.get(c.id)?.status || 'locked',
    progressPercent: statusByCourseId.get(c.id)?.progressPercent || 0,
  }));

  let followStatus = null;
  let isSaved = false;
  if (req.user) {
    const { rows: followRows } = await query(
      'SELECT status FROM user_journeys WHERE user_id = $1 AND journey_id = $2',
      [req.user.id, journey.id]
    );
    followStatus = followRows[0]?.status || null;
    const { rows: savedRows } = await query(
      'SELECT id FROM saved_journeys WHERE user_id = $1 AND journey_id = $2',
      [req.user.id, journey.id]
    );
    isSaved = savedRows.length > 0;
  }

  const completedCourseCount = journeyCoursesWithStatus.filter((c) => c.status === 'completed').length;
  const overallProgress = journeyCoursesWithStatus.length > 0
    ? Math.round((completedCourseCount / journeyCoursesWithStatus.length) * 100)
    : 0;

  res.json({
    journey: {
      ...journey,
      startingSkills,
      skillsGained,
      steps,
      courses: journeyCoursesWithStatus,
      projects: journeyProjects,
      overallProgress,
      completedCourseCount,
      followStatus,
      isFollowing: followStatus === 'active',
      isSaved,
    },
  });
}));

router.post('/:slug/follow', requireAuth, asyncHandler(async (req, res) => {
  const { rows: journeyRows } = await query('SELECT id, title FROM learning_journeys WHERE slug = $1', [req.params.slug]);
  if (journeyRows.length === 0) throw notFound('Journey not found.');
  const journey = journeyRows[0];

  await query(
    `INSERT INTO user_journeys (user_id, journey_id, status) VALUES ($1, $2, 'active')
     ON CONFLICT (user_id, journey_id) DO UPDATE SET status = 'active'`,
    [req.user.id, journey.id]
  );

  const { rows: firstCourse } = await query(
    `SELECT c.id FROM journey_courses jc JOIN courses c ON c.id = jc.course_id
     WHERE jc.journey_id = $1 ORDER BY jc.order_index LIMIT 1`,
    [journey.id]
  );
  if (firstCourse.length > 0) {
    await query(
      'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, firstCourse[0].id]
    );
  }

  await query(
    `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
     VALUES ($1, 'journey_recommendation', 'Journey started', $2, 'journey', $3)`,
    [req.user.id, `You started following the "${journey.title}". Your personalized path is ready.`, journey.id]
  );

  res.status(201).json({ message: 'Journey followed.', journeyId: journey.id });
}));

// Pausing/unfollowing a journey never deletes its progress - it only marks it inactive so it
// stops appearing in "My Learning Paths". Following it again (or resuming) picks up right where it left off.
router.post('/:slug/unfollow', requireAuth, asyncHandler(async (req, res) => {
  const { rows: journeyRows } = await query('SELECT id FROM learning_journeys WHERE slug = $1', [req.params.slug]);
  if (journeyRows.length === 0) throw notFound('Journey not found.');

  await query(
    `UPDATE user_journeys SET status = 'abandoned' WHERE user_id = $1 AND journey_id = $2 AND status = 'active'`,
    [req.user.id, journeyRows[0].id]
  );
  res.json({ message: 'Journey paused.' });
}));

router.post('/:slug/resume', requireAuth, asyncHandler(async (req, res) => {
  const { rows: journeyRows } = await query('SELECT id FROM learning_journeys WHERE slug = $1', [req.params.slug]);
  if (journeyRows.length === 0) throw notFound('Journey not found.');

  const { rows } = await query(
    `UPDATE user_journeys SET status = 'active' WHERE user_id = $1 AND journey_id = $2 AND status = 'abandoned' RETURNING id`,
    [req.user.id, journeyRows[0].id]
  );
  if (rows.length === 0) throw notFound('No paused journey found to resume.');
  res.json({ message: 'Journey resumed.' });
}));

router.post('/:slug/save', requireAuth, asyncHandler(async (req, res) => {
  const { rows: journeyRows } = await query('SELECT id FROM learning_journeys WHERE slug = $1', [req.params.slug]);
  if (journeyRows.length === 0) throw notFound('Journey not found.');
  const journeyId = journeyRows[0].id;

  const { rows: existing } = await query(
    'SELECT id FROM saved_journeys WHERE user_id = $1 AND journey_id = $2',
    [req.user.id, journeyId]
  );

  if (existing.length > 0) {
    await query('DELETE FROM saved_journeys WHERE id = $1', [existing[0].id]);
    return res.json({ saved: false });
  }
  await query('INSERT INTO saved_journeys (user_id, journey_id) VALUES ($1, $2)', [req.user.id, journeyId]);
  res.json({ saved: true });
}));

router.get('/me/saved', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT j.id, j.title, j.slug, j.learner_label, j.starting_level, j.outcome, j.duration_weeks,
            g.title AS goal_title, sj.saved_at
     FROM saved_journeys sj JOIN learning_journeys j ON j.id = sj.journey_id
     JOIN goals g ON g.id = j.goal_id
     WHERE sj.user_id = $1 ORDER BY sj.saved_at DESC`,
    [req.user.id]
  );
  const journeys = await attachJourneySummaries(rows);
  res.json({ journeys });
}));

export default router;
