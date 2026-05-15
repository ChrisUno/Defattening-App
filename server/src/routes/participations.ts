import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const toPart = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  startWeightKg: row.start_weight_kg,
  goalWeightKg: row.goal_weight_kg,
  joinedAt: row.joined_at,
});

router.get('/', requireAuth, async (req, res) => {
  const { sessionId } = req.query;
  const { rows } = sessionId
    ? await pool.query('SELECT * FROM participations WHERE session_id = $1', [sessionId])
    : await pool.query('SELECT * FROM participations');
  res.json(rows.map(toPart));
});

router.post('/', requireAuth, async (req, res) => {
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
    res.json(toPart(rows[0]));
    return;
  }

  const id = `part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await pool.query(
    `INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg) VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, sessionId, startWeightKg, goalWeightKg]
  );

  const { rows } = await pool.query('SELECT * FROM participations WHERE id = $1', [id]);
  res.status(201).json(toPart(rows[0]));
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await pool.query('SELECT * FROM participations WHERE id = $1', [id]);
  if (existing.length === 0) {
    res.status(404).json({ message: 'Participation not found' });
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
  res.json(toPart(rows[0]));
});

router.post('/admin', requireAdmin, async (req, res) => {
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
    res.json(toPart(rows[0]));
    return;
  }

  const id = `part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await pool.query(
    `INSERT INTO participations (id, user_id, session_id, start_weight_kg, goal_weight_kg) VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, sessionId, startWeightKg, goalWeightKg]
  );

  const { rows } = await pool.query('SELECT * FROM participations WHERE id = $1', [id]);
  res.status(201).json(toPart(rows[0]));
});

router.delete('/:id', requireAdmin, async (req, res) => {
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
});

export default router;
