import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const toJournal = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  weekIndex: row.week_index,
  content: row.content,
  createdAt: row.created_at,
});

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { sessionId, userId } = req.query;
  let rows: any[];

  if (sessionId && userId) {
    ({ rows } = await pool.query('SELECT * FROM journals WHERE session_id = $1 AND user_id = $2 ORDER BY week_index', [sessionId, userId]));
  } else if (sessionId) {
    ({ rows } = await pool.query('SELECT * FROM journals WHERE session_id = $1 ORDER BY week_index', [sessionId]));
  } else {
    ({ rows } = await pool.query('SELECT * FROM journals WHERE user_id = $1 ORDER BY week_index', [req.session.userId!]));
  }

  res.json(rows.map(toJournal));
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.session.userId!;
  const { sessionId, weekIndex, content } = req.body;

  if (!sessionId || weekIndex === undefined || !content) {
    res.status(400).json({ message: 'sessionId, weekIndex, and content are required' });
    return;
  }

  const { rows: existing } = await pool.query(
    'SELECT id FROM journals WHERE user_id = $1 AND session_id = $2 AND week_index = $3',
    [userId, sessionId, weekIndex]
  );

  const now = new Date().toISOString();

  if (existing.length > 0) {
    await pool.query('UPDATE journals SET content = $1, created_at = $2 WHERE id = $3', [content, now, existing[0].id]);
    const { rows } = await pool.query('SELECT * FROM journals WHERE id = $1', [existing[0].id]);
    res.json(toJournal(rows[0]));
    return;
  }

  const id = `journal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await pool.query(
    `INSERT INTO journals (id, user_id, session_id, week_index, content) VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, sessionId, weekIndex, content]
  );

  const { rows } = await pool.query('SELECT * FROM journals WHERE id = $1', [id]);
  res.status(201).json(toJournal(rows[0]));
}));

export default router;
