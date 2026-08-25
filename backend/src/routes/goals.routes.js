import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id, title, slug, description FROM goals ORDER BY title');
  res.json({ goals: rows });
}));

export default router;
