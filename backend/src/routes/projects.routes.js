import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search, skill, difficulty } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (difficulty) {
    params.push(difficulty);
    conditions.push(`p.difficulty = $${params.length}`);
  }
  if (skill) {
    params.push(skill);
    conditions.push(`EXISTS (SELECT 1 FROM project_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.project_id = p.id AND s.slug = $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT p.id, p.title, p.slug, p.description, p.difficulty, p.estimated_hours, p.image_url,
            COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS skills
     FROM projects p
     LEFT JOIN project_skills ps ON ps.project_id = p.id
     LEFT JOIN skills s ON s.id = ps.skill_id
     ${where}
     GROUP BY p.id ORDER BY p.title`,
    params
  );

  let statusMap = {};
  if (req.user) {
    const { rows: statuses } = await query('SELECT project_id, status, progress_percent FROM user_projects WHERE user_id = $1', [req.user.id]);
    statusMap = Object.fromEntries(statuses.map((s) => [s.project_id, s]));
  }

  res.json({ projects: rows.map((p) => ({ ...p, status: statusMap[p.id]?.status || 'not_started', progressPercent: statusMap[p.id]?.progress_percent || 0 })) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.title, p.slug, p.difficulty, p.estimated_hours, p.image_url,
            up.status, up.progress_percent, up.started_at, up.completed_at
     FROM user_projects up JOIN projects p ON p.id = up.project_id
     WHERE up.user_id = $1 ORDER BY up.started_at DESC NULLS LAST`,
    [req.user.id]
  );
  res.json({ projects: rows });
}));

router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM projects WHERE slug = $1', [req.params.slug]);
  if (rows.length === 0) throw notFound('Project not found.');
  const project = rows[0];

  const [{ rows: skills }, { rows: relatedCourses }] = await Promise.all([
    query('SELECT s.id, s.name FROM project_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.project_id = $1', [project.id]),
    query(
      `SELECT c.id, c.title, c.slug FROM project_related_courses prc JOIN courses c ON c.id = prc.course_id WHERE prc.project_id = $1`,
      [project.id]
    ),
  ]);

  let status = 'not_started';
  let progressPercent = 0;
  if (req.user) {
    const { rows: statusRows } = await query(
      'SELECT status, progress_percent FROM user_projects WHERE user_id = $1 AND project_id = $2',
      [req.user.id, project.id]
    );
    if (statusRows.length > 0) {
      status = statusRows[0].status;
      progressPercent = statusRows[0].progress_percent;
    }
  }

  res.json({ project: { ...project, skills, relatedCourses, status, progressPercent } });
}));

router.post('/:id/start', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw notFound('Project not found.');

  await query(
    `INSERT INTO user_projects (user_id, project_id, status, progress_percent, started_at)
     VALUES ($1, $2, 'in_progress', 10, now())
     ON CONFLICT (user_id, project_id) DO UPDATE SET
       status = CASE WHEN user_projects.status = 'completed' THEN user_projects.status ELSE 'in_progress' END,
       started_at = COALESCE(user_projects.started_at, now())`,
    [req.user.id, req.params.id]
  );
  res.status(201).json({ message: 'Project started.' });
}));

router.post('/:id/complete', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id, title FROM projects WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw notFound('Project not found.');

  await query(
    `INSERT INTO user_projects (user_id, project_id, status, progress_percent, started_at, completed_at)
     VALUES ($1, $2, 'completed', 100, now(), now())
     ON CONFLICT (user_id, project_id) DO UPDATE SET status = 'completed', progress_percent = 100, completed_at = now()`,
    [req.user.id, req.params.id]
  );

  await query(
    `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
     VALUES ($1, 'project_completion', 'Project completed', $2, 'project', $3)`,
    [req.user.id, `You completed the "${rows[0].title}" project. Nice work!`, rows[0].id]
  );

  res.json({ message: 'Project marked complete.' });
}));

export default router;
