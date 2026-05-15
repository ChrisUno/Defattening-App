import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

interface ActivityRow {
  id: string;
  type: string;
  occurred_at: string;
  session_id: string;
  actor_user_id: string;
  target_user_id: string;
  actor_pct: number;
  target_pct: number;
}

const toActivity = (row: ActivityRow) => ({
  id: row.id,
  type: row.type,
  occurredAt: row.occurred_at,
  sessionId: row.session_id,
  actorUserId: row.actor_user_id,
  targetUserId: row.target_user_id,
  actorPct: row.actor_pct,
  targetPct: row.target_pct,
});

router.get('/', requireAuth, (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    res.status(400).json({ message: 'sessionId query param is required' });
    return;
  }
  const rows = db.prepare(
    'SELECT * FROM activity_entries WHERE session_id = ? ORDER BY occurred_at DESC LIMIT 40'
  ).all(sessionId) as ActivityRow[];
  res.json(rows.map(toActivity));
});

export default router;
