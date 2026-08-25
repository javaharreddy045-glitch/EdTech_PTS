import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Summarizes one followed journey independently: its own progress, next step, and last activity.
// Following additional journeys never touches this - each path's numbers come only from its own data.
async function buildActivePathSummary(userId, uj) {
  const journeyId = uj.journey_id;

  const [{ rows: courseRows }, { rows: projectRows }, { rows: activityRows }] = await Promise.all([
    query(
      `SELECT c.id, c.title, c.slug, c.difficulty, c.duration_hours, jc.order_index,
              COALESCE(e.status, 'not_started') AS status, COALESCE(e.progress_percent, 0) AS progress_percent
       FROM journey_courses jc JOIN courses c ON c.id = jc.course_id
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
       WHERE jc.journey_id = $2 ORDER BY jc.order_index`,
      [userId, journeyId]
    ),
    query(
      `SELECT p.id, p.title, p.slug, p.difficulty, p.estimated_hours, jp.order_index,
              COALESCE(up.status, 'not_started') AS status
       FROM journey_projects jp JOIN projects p ON p.id = jp.project_id
       LEFT JOIN user_projects up ON up.project_id = p.id AND up.user_id = $1
       WHERE jp.journey_id = $2 ORDER BY jp.order_index`,
      [userId, journeyId]
    ),
    query(
      `SELECT GREATEST(
         COALESCE((SELECT MAX(lp.completed_at) FROM lesson_progress lp
                     JOIN lessons l ON l.id = lp.lesson_id
                     JOIN journey_courses jc ON jc.course_id = l.course_id
                    WHERE jc.journey_id = $2 AND lp.user_id = $1 AND lp.completed = true), $3),
         COALESCE((SELECT MAX(up.completed_at) FROM user_projects up
                     JOIN journey_projects jp ON jp.project_id = up.project_id
                    WHERE jp.journey_id = $2 AND up.user_id = $1 AND up.completed_at IS NOT NULL), $3)
       ) AS last_activity_at`,
      [userId, journeyId, uj.started_at]
    ),
  ]);

  const totalSteps = courseRows.length + projectRows.length;
  const completedSteps = courseRows.filter((c) => c.status === 'completed').length
    + projectRows.filter((p) => p.status === 'completed').length;
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const completedCourses = courseRows.filter((c) => c.status === 'completed').length;

  // The learner's current course is whichever one isn't finished yet, in order - never the
  // next locked course. A course they're actively enrolled in but haven't finished always
  // takes priority over one they haven't started.
  const nextCourse = courseRows.find((c) => c.status !== 'completed');
  const nextProject = !nextCourse ? projectRows.find((p) => p.status !== 'completed') : null;
  const nextStep = nextCourse
    ? { type: 'course', title: nextCourse.title, slug: nextCourse.slug, status: nextCourse.status, difficulty: nextCourse.difficulty, durationHours: nextCourse.duration_hours, progressPercent: nextCourse.progress_percent }
    : nextProject
      ? { type: 'project', title: nextProject.title, slug: nextProject.slug, status: nextProject.status, difficulty: nextProject.difficulty, durationHours: nextProject.estimated_hours }
      : null;

  return {
    id: journeyId,
    title: uj.title,
    slug: uj.slug,
    description: uj.description,
    outcome: uj.outcome,
    totalCourses: courseRows.length,
    completedCourses,
    totalSteps,
    completedSteps,
    overallProgress,
    nextStep,
    lastActivityAt: activityRows[0]?.last_activity_at || uj.started_at,
  };
}

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
    `SELECT uj.journey_id, uj.started_at, j.title, j.slug, j.outcome, j.description
     FROM user_journeys uj JOIN learning_journeys j ON j.id = uj.journey_id
     WHERE uj.user_id = $1 AND uj.status = 'active'
     ORDER BY uj.started_at DESC`,
    [userId]
  );

  const activePaths = await Promise.all(activeJourneyRows.map((uj) => buildActivePathSummary(userId, uj)));
  activePaths.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

  const overallLearningProgress = activePaths.length > 0
    ? Math.round(activePaths.reduce((sum, p) => sum + p.overallProgress, 0) / activePaths.length)
    : 0;

  // Recommendations prefer each active path's own next step (with a reason tying it back to
  // that path), then top up with generic top-rated items the learner hasn't started yet.
  // Only the slug + which journey it's for is needed here - full card data is fetched below
  // in one pass so the dashboard can reuse the same CourseCard/ProjectCard as everywhere else.
  const pathCourseSlugs = activePaths
    .filter((p) => p.nextStep?.type === 'course')
    .map((p) => ({ slug: p.nextStep.slug, journeyTitle: p.title }));
  const pathProjectSlugs = activePaths
    .filter((p) => p.nextStep?.type === 'project')
    .map((p) => ({ slug: p.nextStep.slug, journeyTitle: p.title }));

  const { rows: fallbackCourseSlugs } = await query(
    `SELECT slug FROM courses c
     WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = $1 AND e.course_id = c.id)
     ORDER BY c.rating_avg DESC, c.learner_count DESC LIMIT 4`,
    [userId]
  );
  const { rows: fallbackProjectSlugs } = await query(
    `SELECT slug FROM projects p
     WHERE NOT EXISTS (SELECT 1 FROM user_projects up WHERE up.user_id = $1 AND up.project_id = p.id)
     ORDER BY p.title LIMIT 4`,
    [userId]
  );

  const courseSlugPlan = dedupeBySlug([...pathCourseSlugs, ...fallbackCourseSlugs.map((c) => ({ slug: c.slug }))]).slice(0, 2);
  const projectSlugPlan = dedupeBySlug([...pathProjectSlugs, ...fallbackProjectSlugs.map((p) => ({ slug: p.slug }))]).slice(0, 2);
  const journeyTitleBySlug = new Map([...pathCourseSlugs, ...pathProjectSlugs].map((s) => [s.slug, s.journeyTitle]));

  let recommendedCourses = [];
  if (courseSlugPlan.length > 0) {
    const { rows } = await query(
      `SELECT c.title, c.slug, c.image_url, c.difficulty, c.duration_hours, c.rating_avg, c.rating_count, c.learner_count, c.project_count,
              i.name AS instructor_name,
              COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS skills
       FROM courses c
       LEFT JOIN instructors i ON i.id = c.instructor_id
       LEFT JOIN course_skills cs ON cs.course_id = c.id
       LEFT JOIN skills s ON s.id = cs.skill_id
       WHERE c.slug = ANY($1)
       GROUP BY c.id, i.name`,
      [courseSlugPlan.map((c) => c.slug)]
    );
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    recommendedCourses = courseSlugPlan.map((c) => ({ ...bySlug.get(c.slug), journeyTitle: journeyTitleBySlug.get(c.slug) }));
  }

  let recommendedProjects = [];
  if (projectSlugPlan.length > 0) {
    const { rows } = await query(
      `SELECT p.title, p.slug, p.description, p.image_url, p.difficulty, p.estimated_hours,
              COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS skills
       FROM projects p
       LEFT JOIN project_skills ps ON ps.project_id = p.id
       LEFT JOIN skills s ON s.id = ps.skill_id
       WHERE p.slug = ANY($1)
       GROUP BY p.id`,
      [projectSlugPlan.map((p) => p.slug)]
    );
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    recommendedProjects = projectSlugPlan.map((p) => ({ ...bySlug.get(p.slug), status: 'not_started', progressPercent: 0, journeyTitle: journeyTitleBySlug.get(p.slug) }));
  }

  const { rows: similarJourneys } = await query(
    `SELECT j.id, j.title, j.slug, j.learner_label, j.outcome, j.duration_weeks,
            (CASE WHEN j.goal_id = $1 THEN 1 ELSE 0 END) AS goal_match,
            (SELECT COUNT(*)::int FROM journey_starting_skills jss WHERE jss.journey_id = j.id AND jss.skill_id = ANY($2)) AS skill_overlap,
            (SELECT COUNT(*)::int FROM journey_courses jc WHERE jc.journey_id = j.id) AS course_count,
            (SELECT COUNT(*)::int FROM journey_projects jp WHERE jp.journey_id = j.id) AS project_count
     FROM learning_journeys j
     WHERE j.id NOT IN (SELECT journey_id FROM user_journeys WHERE user_id = $3)
     ORDER BY goal_match DESC, skill_overlap DESC LIMIT 3`,
    [profile?.goal_id || null, skillIds.length ? skillIds : [0], userId]
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
    `SELECT 'lesson_completed' AS kind, l.title AS label, lp.completed_at AS occurred_at,
            (SELECT j.title FROM journey_courses jc JOIN learning_journeys j ON j.id = jc.journey_id
              WHERE jc.course_id = l.course_id LIMIT 1) AS context
     FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
     WHERE lp.user_id = $1 AND lp.completed = true
     UNION ALL
     SELECT 'project_completed' AS kind, p.title AS label, up.completed_at AS occurred_at,
            (SELECT j.title FROM journey_projects jp JOIN learning_journeys j ON j.id = jp.journey_id
              WHERE jp.project_id = p.id LIMIT 1) AS context
     FROM user_projects up JOIN projects p ON p.id = up.project_id
     WHERE up.user_id = $1 AND up.status = 'completed'
     UNION ALL
     SELECT 'assessment_taken' AS kind, a.title AS label, ar.taken_at AS occurred_at, s.name AS context
     FROM assessment_results ar JOIN assessments a ON a.id = ar.assessment_id
     LEFT JOIN skills s ON s.id = a.skill_id
     WHERE ar.user_id = $1
     ORDER BY occurred_at DESC NULLS LAST LIMIT 5`,
    [userId]
  );

  const { rows: overallStats } = await query(
    `SELECT
       (SELECT COUNT(*) FILTER (WHERE status = 'completed')::int FROM enrollments WHERE user_id = $1) AS completed_courses,
       (SELECT COUNT(*) FILTER (WHERE status = 'completed')::int FROM user_projects WHERE user_id = $1) AS completed_projects,
       (SELECT COUNT(*)::int FROM user_skills WHERE user_id = $1) AS skills_gained`,
    [userId]
  );

  // Suggest an assessment tied to the skill of whichever course the learner is currently on,
  // so "practice/validate" ties back to the path they're actually following.
  const currentCourseSlug = activePaths.find((p) => p.nextStep?.type === 'course')?.nextStep?.slug;
  let suggestedAssessment = null;
  if (currentCourseSlug) {
    const { rows } = await query(
      `SELECT a.id, a.title, a.slug, a.description,
              (SELECT COUNT(*)::int FROM assessment_questions q WHERE q.assessment_id = a.id) AS question_count
       FROM assessments a
       WHERE a.skill_id IN (SELECT cs.skill_id FROM course_skills cs JOIN courses c ON c.id = cs.course_id WHERE c.slug = $1)
         AND NOT EXISTS (SELECT 1 FROM assessment_results ar WHERE ar.user_id = $2 AND ar.assessment_id = a.id)
       LIMIT 1`,
      [currentCourseSlug, userId]
    );
    suggestedAssessment = rows[0] || null;
  }

  res.json({
    goal: profile?.goal_title || null,
    currentLevel: profile?.current_level || null,
    activePaths,
    overallLearningProgress,
    recommendedCourses,
    recommendedProjects,
    suggestedAssessment,
    similarJourneys,
    recentActivity,
    stats: overallStats[0],
  });
}));

function dedupeBySlug(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    result.push(item);
  }
  return result;
}

export default router;
