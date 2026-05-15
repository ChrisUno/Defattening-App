import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

interface JournalRow {
  id: string;
  user_id: string;
  session_id: string;
  week_index: number;
  content: string;
  created_at: string;
}

const toJournal = (row: JournalRow) => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  weekIndex: row.week_index,
  content: row.content,
  createdAt: row.created_at,
});

router.get('/', requireAuth, (req, res) => {
  const { sessionId, userId } = req.query;
  let rows: JournalRow[];

  if (sessionId && userId) {
    rows = db.prepare('SELECT * FROM journals WHERE session_id = ? AND user_id = ? ORDER BY week_index').all(sessionId, userId) as JournalRow[];
  } else if (sessionId) {
    rows = db.prepare('SELECT * FROM journals WHERE session_id = ? ORDER BY week_index').all(sessionId) as JournalRow[];
  } else {
    rows = db.prepare('SELECT * FROM journals WHERE user_id = ? ORDER BY week_index').all(req.session.userId!) as JournalRow[];
  }

  res.json(rows.map(toJournal));
});

router.post('/', requireAuth, (req, res) => {
  const userId = req.session.userId!;
  const { sessionId, weekIndex, content } = req.body;

  if (!sessionId || weekIndex === undefined || !content) {
    res.status(400).json({ message: 'sessionId, weekIndex, and content are required' });
    return;
  }

  const existing = db.prepare(
    'SELECT id FROM journals WHERE user_id = ? AND session_id = ? AND week_index = ?'
  ).get(userId, sessionId, weekIndex) as { id: string } | undefined;

  const now = new Date().toISOString();

  if (existing) {
    db.prepare('UPDATE journals SET content = ?, created_at = ? WHERE id = ?').run(content, now, existing.id);
    const row = db.prepare('SELECT * FROM journals WHERE id = ?').get(existing.id) as JournalRow;
    res.json(toJournal(row));
    return;
  }

  const id = `journal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(
    `INSERT INTO journals (id, user_id, session_id, week_index, content) VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, sessionId, weekIndex, content);

  const row = db.prepare('SELECT * FROM journals WHERE id = ?').get(id) as JournalRow;
  res.status(201).json(toJournal(row));
});

export default router;
