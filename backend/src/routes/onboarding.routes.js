import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireFields, assertOneOf } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const PREFERENCES = ['courses', 'projects', 'practice', 'mixed'];

router.get('/options', asyncHandler(async (req, res) => {
  const [{ rows: goals }, { rows: skills }] = await Promise.all([
    query('SELECT id, title, slug, description FROM goals ORDER BY title'),
    query('SELECT id, name, slug, category FROM skills ORDER BY category, name'),
  ]);
  res.json({ goals, skills, levels: LEVELS, learningPreferences: PREFERENCES });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { goalId, currentLevel, skillIds, learningPreference } = req.body;
  requireFields(req.body, ['goalId', 'currentLevel', 'learningPreference']);
  assertOneOf(currentLevel, LEVELS, 'currentLevel');
  assertOneOf(learningPreference, PREFERENCES, 'learningPreference');

  await query(
    `UPDATE users SET current_goal_id = $1, current_level = $2, learning_preference = $3,
       onboarding_completed = true, updated_at = now()
     WHERE id = $4`,
    [goalId, currentLevel, learningPreference, req.user.id]
  );

  if (Array.isArray(skillIds) && skillIds.length > 0) {
    await query('DELETE FROM user_skills WHERE user_id = $1', [req.user.id]);
    for (const skillId of skillIds) {
      await query(
        'INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [req.user.id, skillId, 'basic']
      );
    }
  }

  await query(
    `INSERT INTO notifications (user_id, type, title, message)
     VALUES ($1, 'new_recommendation', 'Your learning path is ready', 'We found learners with a similar starting point. Check your dashboard for a recommended journey.')`,
    [req.user.id]
  );

  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.current_level, u.learning_preference, u.onboarding_completed,
            g.id AS goal_id, g.title AS goal_title
     FROM users u LEFT JOIN goals g ON g.id = u.current_goal_id
     WHERE u.id = $1`,
    [req.user.id]
  );
  res.json({ user: rows[0] });
}));

export default router;
