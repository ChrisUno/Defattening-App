import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { computeLeaderboard, computeRanksForSession, currentWeekIndex } from '../lib/stats.js';

const router = Router();

interface WeighInRow {
  id: string;
  user_id: string;
  session_id: string;
  weight_kg: number;
  body_fat_pct: number | null;
  week_index: number;
  measured_at: string;
  recorded_at: string;
}

interface UserRow {
  id: string;
  name: string;
  avatar_color: string;
}

interface PartRow {
  id: string;
  user_id: string;
  session_id: string;
  start_weight_kg: number;
  goal_weight_kg: number;
}

interface SessionRow {
  id: string;
  name: string;
  weeks: number;
  start_date: string;
  status: string;
}

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

const toWeighIn = (row: WeighInRow) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  weightKg: row.weight_kg,
  bodyFatPct: row.body_fat_pct,
  weekIndex: row.week_index,
  measuredAt: row.measured_at,
  recordedAt: row.recorded_at,
});

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

const getLeaderboardData = (sessionId: string) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRow | undefined;
  if (!session) return null;

  const users = db.prepare(
    `SELECT u.id, u.name, u.avatar_color FROM users u
     JOIN participations p ON p.user_id = u.id
     WHERE p.session_id = ?`
  ).all(sessionId) as UserRow[];

  const participations = db.prepare('SELECT * FROM participations WHERE session_id = ?').all(sessionId) as PartRow[];
  const weighIns = db.prepare('SELECT * FROM weigh_ins WHERE session_id = ?').all(sessionId) as WeighInRow[];

  return {
    session: { id: session.id, startDate: session.start_date, weeks: session.weeks },
    users: users.map(u => ({ id: u.id, name: u.name, avatarColor: u.avatar_color })),
    participations: participations.map(p => ({
      userId: p.user_id,
      sessionId: p.session_id,
      startWeightKg: p.start_weight_kg,
      goalWeightKg: p.goal_weight_kg,
    })),
    weighIns: weighIns.map(w => ({
      userId: w.user_id,
      sessionId: w.session_id,
      weightKg: w.weight_kg,
      bodyFatPct: w.body_fat_pct,
      weekIndex: w.week_index,
    })),
  };
};

router.get('/', requireAuth, (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    res.status(400).json({ message: 'sessionId query param is required' });
    return;
  }
  const rows = db.prepare('SELECT * FROM weigh_ins WHERE session_id = ? ORDER BY week_index').all(sessionId) as WeighInRow[];
  res.json(rows.map(toWeighIn));
});

router.post('/', requireAuth, (req, res) => {
  const userId = req.session.userId!;
  const { sessionId, weightKg, bodyFatPct, weekIndex, measuredAt } = req.body;

  if (!sessionId || weightKg === undefined || weekIndex === undefined) {
    res.status(400).json({ message: 'sessionId, weightKg, and weekIndex are required' });
    return;
  }

  const data = getLeaderboardData(sessionId);
  if (!data) {
    res.status(404).json({ message: 'Session not found' });
    return;
  }

  const weekIdx = currentWeekIndex(data.session);
  const ranksBefore = computeRanksForSession(
    computeLeaderboard(data.session, data.users, data.participations, data.weighIns, weekIdx)
  );

  const existing = db.prepare(
    'SELECT id FROM weigh_ins WHERE user_id = ? AND session_id = ? AND week_index = ?'
  ).get(userId, sessionId, weekIndex) as { id: string } | undefined;

  const now = new Date().toISOString();
  const measured = measuredAt || now;
  let weighInId: string;

  if (existing) {
    weighInId = existing.id;
    db.prepare(
      'UPDATE weigh_ins SET weight_kg = ?, body_fat_pct = ?, measured_at = ?, recorded_at = ? WHERE id = ?'
    ).run(weightKg, bodyFatPct ?? null, measured, now, existing.id);
  } else {
    weighInId = `weighin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(
      `INSERT INTO weigh_ins (id, user_id, session_id, weight_kg, body_fat_pct, week_index, measured_at, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(weighInId, userId, sessionId, weightKg, bodyFatPct ?? null, weekIndex, measured, now);
  }

  const dataAfter = getLeaderboardData(sessionId)!;
  const boardAfter = computeLeaderboard(dataAfter.session, dataAfter.users, dataAfter.participations, dataAfter.weighIns, weekIdx);
  const ranksAfter = computeRanksForSession(boardAfter);

  const overtakes: ReturnType<typeof toActivity>[] = [];

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
          db.prepare(
            `INSERT INTO activity_entries (id, type, occurred_at, session_id, actor_user_id, target_user_id, actor_pct, target_pct)
             VALUES (?, 'overtake', ?, ?, ?, ?, ?, ?)`
          ).run(actId, now, sessionId, actor.userId, target.userId, actor.cumulativePct, target.cumulativePct);

          const actRow = db.prepare('SELECT * FROM activity_entries WHERE id = ?').get(actId) as ActivityRow;
          overtakes.push(toActivity(actRow));
        }
      }
    }
  }

  const weighIn = db.prepare('SELECT * FROM weigh_ins WHERE id = ?').get(weighInId) as WeighInRow;
  res.json({ weighIn: toWeighIn(weighIn), overtakes });
});

export default router;
