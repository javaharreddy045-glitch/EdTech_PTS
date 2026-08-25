import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { notFound, badRequest } from '../utils/errors.js';
import { toPositiveInt, requireFields } from '../utils/validators.js';
import { getLessonAccessMap } from '../utils/lessonAccess.js';

const router = Router();

const SORT_MAP = {
  popular: 'c.learner_count DESC',
  rating: 'c.rating_avg DESC',
  newest: 'c.created_at DESC',
  duration_asc: 'c.duration_hours ASC',
  duration_desc: 'c.duration_hours DESC',
};

router.get('/', asyncHandler(async (req, res) => {
  const {
    search, category, skill, difficulty, minDuration, maxDuration, minRating, sort, page, pageSize,
  } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`c.category = $${params.length}`);
  }
  if (difficulty) {
    params.push(difficulty);
    conditions.push(`c.difficulty = $${params.length}`);
  }
  if (minDuration) {
    params.push(Number(minDuration));
    conditions.push(`c.duration_hours >= $${params.length}`);
  }
  if (maxDuration) {
    params.push(Number(maxDuration));
    conditions.push(`c.duration_hours <= $${params.length}`);
  }
  if (minRating) {
    params.push(Number(minRating));
    conditions.push(`c.rating_avg >= $${params.length}`);
  }
  if (skill) {
    params.push(skill);
    conditions.push(`EXISTS (SELECT 1 FROM course_skills cs JOIN skills s ON s.id = cs.skill_id WHERE cs.course_id = c.id AND s.slug = $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = SORT_MAP[sort] || SORT_MAP.popular;

  const pageNum = toPositiveInt(page, 1);
  const size = Math.min(toPositiveInt(pageSize, 12), 48);
  const offset = (pageNum - 1) * size;

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM courses c ${where}`, params);
  const total = countResult.rows[0].total;

  params.push(size, offset);
  const { rows } = await query(
    `SELECT c.id, c.title, c.slug, c.category, c.difficulty, c.duration_hours, c.price, c.image_url,
            c.rating_avg, c.rating_count, c.learner_count, c.project_count,
            i.name AS instructor_name,
            COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS skills
     FROM courses c
     LEFT JOIN instructors i ON i.id = c.instructor_id
     LEFT JOIN course_skills cs ON cs.course_id = c.id
     LEFT JOIN skills s ON s.id = cs.skill_id
     ${where}
     GROUP BY c.id, i.name
     ORDER BY ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({ courses: rows, total, page: pageNum, pageSize: size, totalPages: Math.ceil(total / size) });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT DISTINCT category FROM courses ORDER BY category');
  res.json({ categories: rows.map((r) => r.category) });
}));

router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, i.name AS instructor_name, i.title AS instructor_title, i.bio AS instructor_bio, i.avatar_url AS instructor_avatar
     FROM courses c LEFT JOIN instructors i ON i.id = c.instructor_id
     WHERE c.slug = $1`,
    [req.params.slug]
  );
  if (rows.length === 0) throw notFound('Course not found.');
  const course = rows[0];

  const { rows: skills } = await query(
    `SELECT s.id, s.name, s.slug FROM course_skills cs JOIN skills s ON s.id = cs.skill_id WHERE cs.course_id = $1 ORDER BY s.name`,
    [course.id]
  );

  const { rows: relatedProjects } = await query(
    `SELECT p.id, p.title, p.slug, p.difficulty, p.estimated_hours, p.image_url
     FROM project_related_courses prc JOIN projects p ON p.id = prc.project_id
     WHERE prc.course_id = $1 ORDER BY p.title`,
    [course.id]
  );

  let enrollment = null;
  let recommendationReason = null;
  if (req.user) {
    const { rows: enrollRows } = await query(
      'SELECT status, progress_percent FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, course.id]
    );
    enrollment = enrollRows[0] || null;

    const { rows: userRows } = await query(
      `SELECT u.current_level, g.title AS goal_title FROM users u LEFT JOIN goals g ON g.id = u.current_goal_id WHERE u.id = $1`,
      [req.user.id]
    );
    const { rows: completedRows } = await query(
      `SELECT c2.title FROM enrollments e JOIN courses c2 ON c2.id = e.course_id
       WHERE e.user_id = $1 AND e.status = 'completed' ORDER BY e.completed_at DESC LIMIT 1`,
      [req.user.id]
    );
    const goalTitle = userRows[0]?.goal_title;
    const lastCompleted = completedRows[0]?.title;
    if (goalTitle && lastCompleted) {
      recommendationReason = `Recommended because you are learning ${goalTitle} and have completed ${lastCompleted}.`;
    } else if (goalTitle) {
      recommendationReason = `Recommended because it aligns with your goal of becoming a ${goalTitle}.`;
    }
  }

  res.json({ course: { ...course, skills, relatedProjects }, enrollment, recommendationReason });
}));

router.get('/:slug/curriculum', optionalAuth, asyncHandler(async (req, res) => {
  const { rows: courseRows } = await query('SELECT id FROM courses WHERE slug = $1', [req.params.slug]);
  if (courseRows.length === 0) throw notFound('Course not found.');
  const courseId = courseRows[0].id;

  const { rows: lessons } = await query(
    'SELECT id, title, order_index, duration_minutes FROM lessons WHERE course_id = $1 ORDER BY order_index',
    [courseId]
  );

  const accessMap = await getLessonAccessMap(req.user?.id, courseId);

  res.json({
    lessons: lessons.map((l) => {
      const status = accessMap.get(l.id) || 'locked';
      return { ...l, status, completed: status === 'completed' };
    }),
  });
}));

router.get('/:slug/related', asyncHandler(async (req, res) => {
  const { rows: courseRows } = await query('SELECT id, category FROM courses WHERE slug = $1', [req.params.slug]);
  if (courseRows.length === 0) throw notFound('Course not found.');
  const { rows } = await query(
    `SELECT id, title, slug, category, difficulty, duration_hours, rating_avg, image_url
     FROM courses WHERE category = $1 AND id != $2 ORDER BY rating_avg DESC LIMIT 4`,
    [courseRows[0].category, courseRows[0].id]
  );
  res.json({ courses: rows });
}));

router.get('/:slug/reviews', asyncHandler(async (req, res) => {
  const { rows: courseRows } = await query('SELECT id FROM courses WHERE slug = $1', [req.params.slug]);
  if (courseRows.length === 0) throw notFound('Course not found.');
  const { rows } = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.course_id = $1 ORDER BY r.created_at DESC`,
    [courseRows[0].id]
  );
  res.json({ reviews: rows });
}));

router.post('/:slug/reviews', requireAuth, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  requireFields(req.body, ['rating']);
  if (rating < 1 || rating > 5) throw badRequest('Rating must be between 1 and 5.');

  const { rows: courseRows } = await query('SELECT id FROM courses WHERE slug = $1', [req.params.slug]);
  if (courseRows.length === 0) throw notFound('Course not found.');
  const courseId = courseRows[0].id;

  await query(
    `INSERT INTO reviews (user_id, course_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, course_id) DO UPDATE SET rating = $3, comment = $4, created_at = now()`,
    [req.user.id, courseId, rating, comment || null]
  );
  await query(
    `UPDATE courses SET
       rating_count = (SELECT COUNT(*) FROM reviews WHERE course_id = $1),
       rating_avg = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE course_id = $1)
     WHERE id = $1`,
    [courseId]
  );
  res.status(201).json({ message: 'Review submitted.' });
}));

export default router;
