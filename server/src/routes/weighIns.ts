import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { computeLeaderboard, computeRanksForSession, currentWeekIndex } from '../lib/stats.js';

const router = Router();

const toWeighIn = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  weightKg: row.weight_kg,
  bodyFatPct: row.body_fat_pct,
  weekIndex: row.week_index,
  measuredAt: row.measured_at,
  recordedAt: row.recorded_at,
});

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

const getLeaderboardData = async (sessionId: string) => {
  const { rows: sessionRows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  const session = sessionRows[0];
  if (!session) return null;

  const { rows: userRows } = await pool.query(
    `SELECT u.id, u.name, u.avatar_color FROM users u
     JOIN participations p ON p.user_id = u.id
     WHERE p.session_id = $1`,
    [sessionId]
  );

  const { rows: partRows } = await pool.query('SELECT * FROM participations WHERE session_id = $1', [sessionId]);
  const { rows: wiRows } = await pool.query('SELECT * FROM weigh_ins WHERE session_id = $1', [sessionId]);

  return {
    session: { id: session.id, startDate: session.start_date, weeks: session.weeks },
    users: userRows.map((u: any) => ({ id: u.id, name: u.name, avatarColor: u.avatar_color })),
    participations: partRows.map((p: any) => ({
      userId: p.user_id, sessionId: p.session_id,
      startWeightKg: p.start_weight_kg, goalWeightKg: p.goal_weight_kg,
    })),
    weighIns: wiRows.map((w: any) => ({
      userId: w.user_id, sessionId: w.session_id,
      weightKg: w.weight_kg, bodyFatPct: w.body_fat_pct, weekIndex: w.week_index,
    })),
  };
};

router.get('/', requireAuth, async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    res.status(400).json({ message: 'sessionId query param is required' });
    return;
  }
  const { rows } = await pool.query('SELECT * FROM weigh_ins WHERE session_id = $1 ORDER BY week_index', [sessionId]);
  res.json(rows.map(toWeighIn));
});

router.post('/', requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { sessionId, weightKg, bodyFatPct, weekIndex, measuredAt } = req.body;

  if (!sessionId || weightKg === undefined || weekIndex === undefined) {
    res.status(400).json({ message: 'sessionId, weightKg, and weekIndex are required' });
    return;
  }

  const data = await getLeaderboardData(sessionId);
  if (!data) {
    res.status(404).json({ message: 'Session not found' });
    return;
  }

  const weekIdx = currentWeekIndex(data.session);
  const ranksBefore = computeRanksForSession(
    computeLeaderboard(data.session, data.users, data.participations, data.weighIns, weekIdx)
  );

  const { rows: existingRows } = await pool.query(
    'SELECT id FROM weigh_ins WHERE user_id = $1 AND session_id = $2 AND week_index = $3',
    [userId, sessionId, weekIndex]
  );

  const now = new Date().toISOString();
  const measured = measuredAt || now;
  let weighInId: string;

  if (existingRows.length > 0) {
    weighInId = existingRows[0].id;
    await pool.query(
      'UPDATE weigh_ins SET weight_kg = $1, body_fat_pct = $2, measured_at = $3, recorded_at = $4 WHERE id = $5',
      [weightKg, bodyFatPct ?? null, measured, now, weighInId]
    );
  } else {
    weighInId = `weighin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    await pool.query(
      `INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, body_fat_pct, week_index, measured_at, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [weighInId, userId, sessionId, weightKg, bodyFatPct ?? null, weekIndex, measured, now]
    );
  }

  const dataAfter = (await getLeaderboardData(sessionId))!;
  const boardAfter = computeLeaderboard(dataAfter.session, dataAfter.users, dataAfter.participations, dataAfter.weighIns, weekIdx);
  const ranksAfter = computeRanksForSession(boardAfter);

  const overtakes: any[] = [];

  for (const actor of boardAfter) {
    const prev = ranksBefore[actor.userId];
    const next = ranksAfter[actor.userId];
    if (prev == null || next == null) continue;
    if (next < prev) {
      for (const target of boardAfter) {
        if (target.userId === actor.userId) continue;
        const tPrev = ranksBefore[target.userId];
        const tNext = ranksAfter[target.userId];
        if (tPrev == null || tNext == null) continue;
        if (tPrev < prev && tNext > next) {
          const actId = `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          await pool.query(
            `INSERT INTO activity_entries (id, type, occurred_at, session_id, actor_user_id, target_user_id, actor_pct, target_pct)
             VALUES ($1, 'overtake', $2, $3, $4, $5, $6, $7)`,
            [actId, now, sessionId, actor.userId, target.userId, actor.cumulativePct, target.cumulativePct]
          );
          const { rows: actRows } = await pool.query('SELECT * FROM activity_entries WHERE id = $1', [actId]);
          overtakes.push(toActivity(actRows[0]));
        }
      }
    }
  }

  const { rows: wiRows } = await pool.query('SELECT * FROM weigh_ins WHERE id = $1', [weighInId]);
  res.json({ weighIn: toWeighIn(wiRows[0]), overtakes });
});

export default router;
