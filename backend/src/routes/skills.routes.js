import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  if (search) {
    const { rows } = await query(
      'SELECT id, name, slug, category FROM skills WHERE name ILIKE $1 ORDER BY name LIMIT 20',
      [`%${search}%`]
    );
    return res.json({ skills: rows });
  }
  const { rows } = await query('SELECT id, name, slug, category FROM skills ORDER BY category, name');
  res.json({ skills: rows });
}));

export default router;
