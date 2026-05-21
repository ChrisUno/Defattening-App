import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { computeLeaderboard, currentWeekIndex, weeklyPointsFor } from '../lib/stats.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const currentUserId = req.session.userId!;
  const { sessionId } = req.query;

  if (!sessionId) {
    res.status(400).json({ message: 'sessionId query param is required' });
    return;
  }

  const { rows: sessionRows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  const session = sessionRows[0];
  if (!session) {
    res.status(404).json({ message: 'Session not found' });
    return;
  }

  const sessionObj = { id: session.id, startDate: session.start_date, weeks: session.weeks };
  const weekIdx = currentWeekIndex(sessionObj);

  const [{ rows: userRows }, { rows: partRows }, { rows: wiRows }] = await Promise.all([
    pool.query(
      `SELECT u.id, u.name, u.avatar_color FROM users u
       JOIN participations p ON p.user_id = u.id
       WHERE p.session_id = $1`,
      [sessionId],
    ),
    pool.query('SELECT * FROM participations WHERE session_id = $1', [sessionId]),
    pool.query('SELECT * FROM weigh_ins WHERE session_id = $1', [sessionId]),
  ]);

  const users = userRows.map((u: any) => ({ id: u.id, name: u.name, avatarColor: u.avatar_color }));
  const participations = partRows.map((p: any) => ({
    userId: p.user_id, sessionId: p.session_id,
    startWeightKg: p.start_weight_kg, goalWeightKg: p.goal_weight_kg,
  }));
  const weighIns = wiRows.map((w: any) => ({
    userId: w.user_id, sessionId: w.session_id,
    weightKg: w.weight_kg, bodyFatPct: w.body_fat_pct, weekIndex: w.week_index,
  }));

  const board = computeLeaderboard(sessionObj, users, participations, weighIns, weekIdx);

  // Sanitize: null out raw weight fields for non-self entries
  const sanitizedBoard = board.map((entry) => {
    if (entry.userId === currentUserId) return entry;
    return { ...entry, currentWeightKg: null, startWeightKg: null };
  });

  // Compute team total lost (server has raw data)
  const sessionTotalLostKg = board.reduce((sum, stat) => {
    const lost = stat.startWeightKg - (stat.currentWeightKg ?? stat.startWeightKg);
    return sum + Math.max(0, lost);
  }, 0);

  // Build weekly percentage series for chart (no raw weights exposed)
  const weeklyPctSeries = participations.map((part) => {
    const user = users.find((u) => u.id === part.userId);
    if (!user) return null;
    const points = weeklyPointsFor(part, weighIns, weekIdx);
    return {
      userId: user.id,
      userName: user.name,
      avatarColor: user.avatarColor,
      points: points.map((pt) => ({ weekIndex: pt.weekIndex, pctFromStart: pt.pctFromStart })),
    };
  }).filter(Boolean);

  res.json({ board: sanitizedBoard, sessionTotalLostKg, weeklyPctSeries });
}));

export default router;
