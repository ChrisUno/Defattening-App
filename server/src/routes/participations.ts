import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { toParticipation } from '../lib/mappers.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const currentUserId = req.session.userId!;
  const { rows: userRows } = await pool.query('SELECT role FROM users WHERE id = $1', [currentUserId]);
  const isAdmin = userRows[0] && ['admin', 'super_admin'].includes(userRows[0].role);

  const { sessionId } = req.query;
  const { rows } = sessionId
    ? await pool.query('SELECT * FROM participations WHERE session_id = $1', [sessionId])
    : await pool.query('SELECT * FROM participations');

  res.json(rows.map((row: any) => {
    const p = toParticipation(row);
    if (isAdmin || p.userId === currentUserId) return p;
    return { ...p, startWeightKg: null, goalWeightKg: null };
  }));
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.session.userId!;
  const { sessionId, startWeightKg, goalWeightKg } = req.body;
  if (!sessionId || !startWeightKg || !goalWeightKg) {
    res.status(400).json({ message: 'sessionId, startWeightKg, and goalWeightKg are required' });
    return;
  }

  const { rows: existing } = await pool.query(
    'SELECT * FROM participations WHERE user_id = $1 AND session_id = $2',
    [userId, sessionId]
  );

  if (existing.length > 0) {
    await pool.query('UPDATE participations SET start_weight_kg = $1, goal_weight_kg = $2 WHERE id = $3',
      [startWeightKg, goalWeightKg, existing[0].id]);
    const { rows } = await pool.query('SELECT * FROM participations WHERE id = $1', [existing[0].id]);
    res.json(toParticipation(rows[0]));
    return;
  }

  const id = `part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await pool.query(
    `INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg) VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, sessionId, startWeightKg, goalWeightKg]
  );

  const { rows } = await pool.query('SELECT * FROM participations WHERE id = $1', [id]);
  res.status(201).json(toParticipation(rows[0]));
}));

router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await pool.query('SELECT * FROM participations WHERE id = $1', [id]);
  if (existing.length === 0) {
    res.status(404).json({ message: 'Participation not found' });
    return;
  }

  // Ownership check: only owner or admin can modify
  const { rows: userRows } = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId!]);
  const isAdmin = userRows[0] && ['admin', 'super_admin'].includes(userRows[0].role);
  if (existing[0].user_id !== req.session.userId && !isAdmin) {
    res.status(403).json({ message: 'Cannot modify another user\'s participation' });
    return;
  }

  const { startWeightKg, goalWeightKg } = req.body;
  const sets: string[] = [];
  const values: (number | string)[] = [];
  let idx = 1;

  if (startWeightKg !== undefined) { sets.push(`start_weight_kg = $${idx++}`); values.push(startWeightKg); }
  if (goalWeightKg !== undefined) { sets.push(`goal_weight_kg = $${idx++}`); values.push(goalWeightKg); }

  if (sets.length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  values.push(id);
  await pool.query(`UPDATE participations SET ${sets.join(', ')} WHERE id = $${idx}`, values);

  const { rows } = await pool.query('SELECT * FROM participations WHERE id = $1', [id]);
  res.json(toParticipation(rows[0]));
}));

router.post('/admin', requireAdmin, asyncHandler(async (req, res) => {
  const { userId, sessionId, startWeightKg, goalWeightKg } = req.body;
  if (!userId || !sessionId || !startWeightKg || !goalWeightKg) {
    res.status(400).json({ message: 'userId, sessionId, startWeightKg, and goalWeightKg are required' });
    return;
  }

  const { rows: userCheck } = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const { rows: existing } = await pool.query(
    'SELECT * FROM participations WHERE user_id = $1 AND session_id = $2',
    [userId, sessionId]
  );

  if (existing.length > 0) {
    await pool.query('UPDATE participations SET start_weight_kg = $1, goal_weight_kg = $2 WHERE id = $3',
      [startWeightKg, goalWeightKg, existing[0].id]);
    const { rows } = await pool.query('SELECT * FROM participations WHERE id = $1', [existing[0].id]);
    res.json(toParticipation(rows[0]));
    return;
  }

  const id = `part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await pool.query(
    `INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg) VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, sessionId, startWeightKg, goalWeightKg]
  );

  const { rows } = await pool.query('SELECT * FROM participations WHERE id = $1', [id]);
  res.status(201).json(toParticipation(rows[0]));
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT id FROM participations WHERE id = $1', [id]);
  if (rows.length === 0) {
    res.status(404).json({ message: 'Participation not found' });
    return;
  }
  await pool.query('DELETE FROM weigh_ins WHERE user_id = (SELECT user_id FROM participations WHERE id = $1) AND session_id = (SELECT session_id FROM participations WHERE id = $1)', [id]);
  await pool.query('DELETE FROM journals WHERE user_id = (SELECT user_id FROM participations WHERE id = $1) AND session_id = (SELECT session_id FROM participations WHERE id = $1)', [id]);
  await pool.query('DELETE FROM participations WHERE id = $1', [id]);
  res.json({ ok: true });
}));

export default router;
