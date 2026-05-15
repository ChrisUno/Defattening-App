import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

interface PartRow {
  id: string;
  user_id: string;
  session_id: string;
  start_weight_kg: number;
  goal_weight_kg: number;
  joined_at: string;
}

const toPart = (row: PartRow) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  startWeightKg: row.start_weight_kg,
  goalWeightKg: row.goal_weight_kg,
  joinedAt: row.joined_at,
});

router.get('/', requireAuth, (req, res) => {
  const { sessionId } = req.query;
  let rows: PartRow[];
  if (sessionId) {
    rows = db.prepare('SELECT * FROM participations WHERE session_id = ?').all(sessionId) as PartRow[];
  } else {
    rows = db.prepare('SELECT * FROM participations').all() as PartRow[];
  }
  res.json(rows.map(toPart));
});

router.post('/', requireAuth, (req, res) => {
  const userId = req.session.userId!;
  const { sessionId, startWeightKg, goalWeightKg } = req.body;
  if (!sessionId || !startWeightKg || !goalWeightKg) {
    res.status(400).json({ message: 'sessionId, startWeightKg, and goalWeightKg are required' });
    return;
  }

  const existing = db.prepare(
    'SELECT * FROM participations WHERE user_id = ? AND session_id = ?'
  ).get(userId, sessionId) as PartRow | undefined;

  if (existing) {
    db.prepare('UPDATE participations SET start_weight_kg = ?, goal_weight_kg = ? WHERE id = ?')
      .run(startWeightKg, goalWeightKg, existing.id);
    const updated = db.prepare('SELECT * FROM participations WHERE id = ?').get(existing.id) as PartRow;
    res.json(toPart(updated));
    return;
  }

  const id = `part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(
    `INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg) VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, sessionId, startWeightKg, goalWeightKg);

  const row = db.prepare('SELECT * FROM participations WHERE id = ?').get(id) as PartRow;
  res.status(201).json(toPart(row));
});

router.patch('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM participations WHERE id = ?').get(id) as PartRow | undefined;
  if (!existing) {
    res.status(404).json({ message: 'Participation not found' });
    return;
  }

  const { startWeightKg, goalWeightKg } = req.body;
  const updates: string[] = [];
  const values: (number | string)[] = [];

  if (startWeightKg !== undefined) { updates.push('start_weight_kg = ?'); values.push(startWeightKg); }
  if (goalWeightKg !== undefined) { updates.push('goal_weight_kg = ?'); values.push(goalWeightKg); }

  if (updates.length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  values.push(id);
  db.prepare(`UPDATE participations SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM participations WHERE id = ?').get(id) as PartRow;
  res.json(toPart(row));
});

export default router;
