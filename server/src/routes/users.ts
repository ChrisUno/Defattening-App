import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_color: string;
  role: string;
  height_cm: number | null;
  created_at: string;
}

const toUser = (row: UserRow) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  avatarColor: row.avatar_color,
  role: row.role,
  heightCm: row.height_cm,
  createdAt: row.created_at,
});

const AVATAR_COLORS = ['#2563EB', '#1D4ED8', '#0EA5E9', '#0284C7', '#06B6D4', '#0891B2', '#3B82F6', '#6366F1', '#4F46E5', '#7C3AED', '#8B5CF6', '#0F766E', '#14B8A6'];
const pickColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

router.get('/', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
  res.json(rows.map(toUser));
});

router.post('/', requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    res.status(409).json({ message: 'A user with this email already exists' });
    return;
  }

  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, avatar_color, role) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, email.trim().toLowerCase(), passwordHash, name, pickColor(), role || 'user');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  res.status(201).json(toUser(user));
});

router.patch('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId!;

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  if (!target) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const caller = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string };
  const isAdmin = caller.role === 'admin';
  const isSelf = userId === id;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ message: 'Cannot update other users' });
    return;
  }

  const { name, email, heightCm } = req.body;
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (name && (isAdmin || isSelf)) { updates.push('name = ?'); values.push(name); }
  if (email && isAdmin) { updates.push('email = ?'); values.push(email.trim().toLowerCase()); }
  if (heightCm !== undefined) { updates.push('height_cm = ?'); values.push(heightCm); }

  if (updates.length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  values.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  res.json(toUser(updated));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!target) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
