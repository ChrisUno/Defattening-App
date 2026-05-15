import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const toUser = (row: any) => ({
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

router.get('/', requireAuth, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at');
  res.json(rows.map(toUser));
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email) {
    res.status(400).json({ message: 'Name and email are required' });
    return;
  }

  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  if (existing.length > 0) {
    res.status(409).json({ message: 'A user with this email already exists' });
    return;
  }

  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, avatar_color, role) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, email.trim().toLowerCase(), passwordHash, name, pickColor(), role || 'user']
  );

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  res.status(201).json(toUser(rows[0]));
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId!;

  const { rows: targets } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (targets.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const { rows: callers } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  const isAdmin = callers[0]?.role === 'admin';
  const isSelf = userId === id;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ message: 'Cannot update other users' });
    return;
  }

  const { name, email, heightCm } = req.body;
  const sets: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  if (name && (isAdmin || isSelf)) { sets.push(`name = $${idx++}`); values.push(name); }
  if (email && isAdmin) { sets.push(`email = $${idx++}`); values.push(email.trim().toLowerCase()); }
  if (heightCm !== undefined) { sets.push(`height_cm = $${idx++}`); values.push(heightCm); }

  if (sets.length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  values.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, values);

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  res.json(toUser(rows[0]));
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
  if (rows.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
});

export default router;
