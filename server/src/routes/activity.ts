import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const toActivity = (row: any) => ({
  id: row.id,
  type: row.type,
  occurredAt: row.occurred_at,
  sessionId: row.session_id,
  actorUserId: row.actor_user_id,
  targetUserId: row.target_user_id,
  actorPct: row.actor_pct,
  targetPct: row.target_pct,
});

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    res.status(400).json({ message: 'sessionId query param is required' });
    return;
  }
  const { rows } = await pool.query(
    'SELECT * FROM activity_entries WHERE session_id = $1 ORDER BY occurred_at DESC LIMIT 40',
    [sessionId]
  );
  res.json(rows.map(toActivity));
}));

export default router;
