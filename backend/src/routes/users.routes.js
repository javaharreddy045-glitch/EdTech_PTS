import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.avatar_url, u.bio, u.current_level, u.learning_preference,
            u.onboarding_completed, u.created_at,
            g.id AS goal_id, g.title AS goal_title, g.slug AS goal_slug
     FROM users u LEFT JOIN goals g ON g.id = u.current_goal_id
     WHERE u.id = $1`,
    [req.user.id]
  );
  const { rows: skills } = await query(
    `SELECT s.id, s.name, s.slug, s.category, us.proficiency
     FROM user_skills us JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1 ORDER BY s.name`,
    [req.user.id]
  );
  const { rows: completedCourses } = await query(
    `SELECT c.id, c.title, c.slug FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1 AND e.status = 'completed' ORDER BY e.completed_at DESC`,
    [req.user.id]
  );
  const { rows: completedProjects } = await query(
    `SELECT p.id, p.title, p.slug FROM user_projects up JOIN projects p ON p.id = up.project_id
     WHERE up.user_id = $1 AND up.status = 'completed' ORDER BY up.completed_at DESC`,
    [req.user.id]
  );

  res.json({ user: rows[0], skills, completedCourses, completedProjects });
}));

router.put('/me', requireAuth, asyncHandler(async (req, res) => {
  const { name, bio, avatarUrl, currentLevel, learningPreference, goalId } = req.body;

  const { rows } = await query(
    `UPDATE users SET
       name = COALESCE($1, name),
       bio = COALESCE($2, bio),
       avatar_url = COALESCE($3, avatar_url),
       current_level = COALESCE($4, current_level),
       learning_preference = COALESCE($5, learning_preference),
       current_goal_id = COALESCE($6, current_goal_id),
       updated_at = now()
     WHERE id = $7
     RETURNING id, name, email, avatar_url, bio, current_level, learning_preference, current_goal_id`,
    [name, bio, avatarUrl, currentLevel, learningPreference, goalId, req.user.id]
  );
  res.json({ user: rows[0] });
}));

router.put('/me/skills', requireAuth, asyncHandler(async (req, res) => {
  const { skillIds } = req.body;
  if (!Array.isArray(skillIds)) {
    return res.status(400).json({ error: 'skillIds must be an array.' });
  }
  await query('DELETE FROM user_skills WHERE user_id = $1', [req.user.id]);
  for (const skillId of skillIds) {
    await query(
      'INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.user.id, skillId, 'basic']
    );
  }
  const { rows } = await query(
    `SELECT s.id, s.name, s.slug, s.category, us.proficiency
     FROM user_skills us JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1 ORDER BY s.name`,
    [req.user.id]
  );
  res.json({ skills: rows });
}));

export default router;
