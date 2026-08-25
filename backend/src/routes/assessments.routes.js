import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, badRequest } from '../utils/errors.js';
import { requireFields } from '../utils/validators.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT a.id, a.title, a.slug, a.description, s.name AS skill_name,
            (SELECT COUNT(*)::int FROM assessment_questions q WHERE q.assessment_id = a.id) AS question_count
     FROM assessments a LEFT JOIN skills s ON s.id = a.skill_id ORDER BY a.title`
  );
  res.json({ assessments: rows });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT a.id, a.title, a.slug, a.description, s.name AS skill_name
     FROM assessments a LEFT JOIN skills s ON s.id = a.skill_id WHERE a.slug = $1`,
    [req.params.slug]
  );
  if (rows.length === 0) throw notFound('Assessment not found.');
  const assessment = rows[0];

  const { rows: questions } = await query(
    'SELECT id, question_text, options, order_index FROM assessment_questions WHERE assessment_id = $1 ORDER BY order_index',
    [assessment.id]
  );
  res.json({ assessment: { ...assessment, questions } });
}));

router.post('/:slug/submit', requireAuth, asyncHandler(async (req, res) => {
  const { answers } = req.body;
  requireFields(req.body, ['answers']);
  if (!Array.isArray(answers)) throw badRequest('answers must be an array of { questionId, selectedIndex }.');

  const { rows: assessmentRows } = await query('SELECT id, title FROM assessments WHERE slug = $1', [req.params.slug]);
  if (assessmentRows.length === 0) throw notFound('Assessment not found.');
  const assessment = assessmentRows[0];

  const { rows: questions } = await query(
    'SELECT id, correct_option_index FROM assessment_questions WHERE assessment_id = $1',
    [assessment.id]
  );

  const correctMap = Object.fromEntries(questions.map((q) => [q.id, q.correct_option_index]));
  let correctCount = 0;
  for (const answer of answers) {
    if (correctMap[answer.questionId] === answer.selectedIndex) correctCount += 1;
  }
  const total = questions.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const resultingLevel = score >= 80 ? 'advanced' : score >= 50 ? 'intermediate' : 'beginner';

  await query(
    `INSERT INTO assessment_results (user_id, assessment_id, score, total_questions, correct_count, resulting_level)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user.id, assessment.id, score, total, correctCount, resultingLevel]
  );

  await query(
    `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
     VALUES ($1, 'assessment_result', 'Assessment result ready', $2, 'assessment', $3)`,
    [req.user.id, `You scored ${score}% on the "${assessment.title}" (${resultingLevel} level).`, assessment.id]
  );

  res.status(201).json({ score, correctCount, total, resultingLevel });
}));

router.get('/results/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT ar.id, ar.score, ar.total_questions, ar.correct_count, ar.resulting_level, ar.taken_at,
            a.title AS assessment_title, a.slug AS assessment_slug
     FROM assessment_results ar JOIN assessments a ON a.id = ar.assessment_id
     WHERE ar.user_id = $1 ORDER BY ar.taken_at DESC`,
    [req.user.id]
  );
  res.json({ results: rows });
}));

export default router;
