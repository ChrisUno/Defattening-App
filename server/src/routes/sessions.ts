import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

interface SessionRow {
  id: string;
  name: string;
  description: string;
  weeks: number;
  weigh_in_day_of_week: number;
  weigh_in_note: string;
  start_date: string;
  status: string;
  created_by: string;
}

const toSession = (row: SessionRow) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  weeks: row.weeks,
  weighInDayOfWeek: row.weigh_in_day_of_week,
  weighInNote: row.weigh_in_note,
  startDate: row.start_date,
  status: row.status,
  createdBy: row.created_by,
});

router.get('/', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM sessions ORDER BY start_date DESC').all() as SessionRow[];
  res.json(rows.map(toSession));
});

router.post('/', requireAdmin, (req, res) => {
  const { name, description, weeks, weighInDayOfWeek, weighInNote, startDate, status } = req.body;
  if (!name || !weeks || !startDate) {
    res.status(400).json({ message: 'Name, weeks, and start date are required' });
    return;
  }

  const id = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  db.prepare(
    `INSERT INTO sessions (id, name, description, weeks, weigh_in_day_of_week, weigh_in_note, start_date, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, description || '', weeks, weighInDayOfWeek ?? 1, weighInNote || '', startDate, status || 'upcoming', req.session.userId!);

  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow;
  res.status(201).json(toSession(row));
});

router.patch('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ message: 'Session not found' });
    return;
  }

  const { name, description, weeks, weighInDayOfWeek, weighInNote, startDate, status } = req.body;
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (weeks !== undefined) { updates.push('weeks = ?'); values.push(weeks); }
  if (weighInDayOfWeek !== undefined) { updates.push('weigh_in_day_of_week = ?'); values.push(weighInDayOfWeek); }
  if (weighInNote !== undefined) { updates.push('weigh_in_note = ?'); values.push(weighInNote); }
  if (startDate !== undefined) { updates.push('start_date = ?'); values.push(startDate); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }

  if (updates.length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  values.push(id);
  db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow;
  res.json(toSession(row));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ message: 'Session not found' });
    return;
  }

  db.prepare('DELETE FROM activity_entries WHERE session_id = ?').run(id);
  db.prepare('DELETE FROM journals WHERE session_id = ?').run(id);
  db.prepare('DELETE FROM weigh_ins WHERE session_id = ?').run(id);
  db.prepare('DELETE FROM participations WHERE session_id = ?').run(id);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
