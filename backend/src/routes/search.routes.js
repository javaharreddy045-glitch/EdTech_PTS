import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json({ courses: [], journeys: [], projects: [], skills: [], instructors: [] });
  }
  const term = `%${q.trim()}%`;

  const [courses, journeys, projects, skills, instructors] = await Promise.all([
    query(
      `SELECT id, title, slug, category, difficulty FROM courses WHERE title ILIKE $1 OR description ILIKE $1 LIMIT 6`,
      [term]
    ),
    query(
      `SELECT id, title, slug, outcome FROM learning_journeys WHERE title ILIKE $1 OR description ILIKE $1 LIMIT 6`,
      [term]
    ),
    query(
      `SELECT id, title, slug, difficulty FROM projects WHERE title ILIKE $1 OR description ILIKE $1 LIMIT 6`,
      [term]
    ),
    query(`SELECT id, name, slug, category FROM skills WHERE name ILIKE $1 LIMIT 6`, [term]),
    query(`SELECT id, name, title FROM instructors WHERE name ILIKE $1 LIMIT 6`, [term]),
  ]);

  res.json({
    courses: courses.rows,
    journeys: journeys.rows,
    projects: projects.rows,
    skills: skills.rows,
    instructors: instructors.rows,
  });
}));

export default router;
