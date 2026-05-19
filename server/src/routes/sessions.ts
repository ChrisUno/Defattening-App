import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { toSession } from '../lib/mappers.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM sessions ORDER BY start_date DESC');
  res.json(rows.map(toSession));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { name, description, weeks, weighInDayOfWeek, weighInNote, startDate, status } = req.body;
  if (!name || !weeks || !startDate) {
    res.status(400).json({ message: 'Name, weeks, and start date are required' });
    return;
  }

  const id = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  await pool.query(
    `INSERT INTO sessions (id, name, description, weeks, weigh_in_day_of_week, weigh_in_note, start_date, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, name, description || '', weeks, weighInDayOfWeek ?? 1, weighInNote || '', startDate, status || 'upcoming', req.session.userId!]
  );

  const { rows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
  res.status(201).json(toSession(rows[0]));
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await pool.query('SELECT id FROM sessions WHERE id = $1', [id]);
  if (existing.length === 0) {
    res.status(404).json({ message: 'Session not found' });
    return;
  }

  const { name, description, weeks, weighInDayOfWeek, weighInNote, startDate, status } = req.body;
  const sets: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  if (name !== undefined) { sets.push(`name = $${idx++}`); values.push(name); }
  if (description !== undefined) { sets.push(`description = $${idx++}`); values.push(description); }
  if (weeks !== undefined) { sets.push(`weeks = $${idx++}`); values.push(weeks); }
  if (weighInDayOfWeek !== undefined) { sets.push(`weigh_in_day_of_week = $${idx++}`); values.push(weighInDayOfWeek); }
  if (weighInNote !== undefined) { sets.push(`weigh_in_note = $${idx++}`); values.push(weighInNote); }
  if (startDate !== undefined) { sets.push(`start_date = $${idx++}`); values.push(startDate); }
  if (status !== undefined) { sets.push(`status = $${idx++}`); values.push(status); }

  if (sets.length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  values.push(id);
  await pool.query(`UPDATE sessions SET ${sets.join(', ')} WHERE id = $${idx}`, values);

  const { rows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
  res.json(toSession(rows[0]));
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT id FROM sessions WHERE id = $1', [id]);
  if (rows.length === 0) {
    res.status(404).json({ message: 'Session not found' });
    return;
  }

  await pool.query('DELETE FROM activity_entries WHERE session_id = $1', [id]);
  await pool.query('DELETE FROM journals WHERE session_id = $1', [id]);
  await pool.query('DELETE FROM weigh_ins WHERE session_id = $1', [id]);
  await pool.query('DELETE FROM participations WHERE session_id = $1', [id]);
  await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
  res.json({ ok: true });
}));

export default router;
