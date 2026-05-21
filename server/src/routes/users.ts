import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { toUser } from '../lib/mappers.js';
import { pickColor } from '../lib/avatarColors.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const currentUserId = req.session.userId!;
  const { rows: callerRows } = await pool.query('SELECT role FROM users WHERE id = $1', [currentUserId]);
  const isAdmin = callerRows[0] && ['admin', 'super_admin'].includes(callerRows[0].role);

  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at');
  res.json(rows.map((row: any) => {
    const u = toUser(row);
    // Strip personal data for non-self, non-admin
    if (!isAdmin && u.id !== currentUserId) {
      return { ...u, email: null, heightCm: null };
    }
    return u;
  }));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
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

  // Never allow creating super_admin users via API
  const safeRole = (role === 'admin') ? 'admin' : 'user';

  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, avatar_color, role) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, email.trim().toLowerCase(), passwordHash, name, pickColor(), safeRole]
  );

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  res.status(201).json(toUser(rows[0]));
}));

router.patch('/:id/role', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'user'].includes(role)) {
    res.status(400).json({ message: 'Role must be "admin" or "user"' });
    return;
  }

  if (id === req.session.userId) {
    res.status(403).json({ message: 'Cannot change your own role' });
    return;
  }

  const { rows: target } = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
  if (!target[0]) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (target[0].role === 'super_admin') {
    res.status(403).json({ message: 'Cannot modify a super admin' });
    return;
  }

  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  res.json(toUser(rows[0]));
}));

router.patch('/:id/temp-admin', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isTempAdmin, expiresAt } = req.body;

  if (typeof isTempAdmin !== 'boolean') {
    res.status(400).json({ message: 'isTempAdmin must be a boolean' });
    return;
  }

  const { rows: target } = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
  if (!target[0]) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (target[0].role === 'super_admin') {
    res.status(403).json({ message: "Super admins don't need temp admin" });
    return;
  }

  // If toggling off, also clear expiry
  const expiry = isTempAdmin ? (expiresAt ?? null) : null;

  await pool.query(
    'UPDATE users SET is_temp_admin = $1, temp_admin_expires_at = $2 WHERE id = $3',
    [isTempAdmin, expiry, id]
  );

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  res.json(toUser(rows[0]));
}));

router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId!;

  const { rows: targets } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (targets.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const { rows: callers } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  const isAdmin = ['admin', 'super_admin'].includes(callers[0]?.role);
  const isSelf = userId === id;

  // Prevent non-super_admin from editing super_admin
  if (targets[0].role === 'super_admin' && !isSelf && callers[0]?.role !== 'super_admin') {
    res.status(403).json({ message: 'Cannot modify the super admin' });
    return;
  }

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
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
  if (rows.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (rows[0].role === 'super_admin') {
    res.status(403).json({ message: 'Cannot delete the super admin' });
    return;
  }
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
}));

export default router;
