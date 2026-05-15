import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

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

const toUserResponse = (row: UserRow) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  avatarColor: row.avatar_color,
  role: row.role,
  heightCm: row.height_cm,
  createdAt: row.created_at,
});

const hasActiveParticipation = (userId: string): boolean => {
  const row = db.prepare(`
    SELECT 1 FROM participations p
    JOIN sessions s ON s.id = p.session_id
    WHERE p.user_id = ? AND s.status IN ('active', 'upcoming')
    LIMIT 1
  `).get(userId);
  return !!row;
};

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as UserRow | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  req.session.userId = user.id;
  res.json({
    user: toUserResponse(user),
    hasActiveParticipation: hasActiveParticipation(user.id),
  });
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: 'Failed to logout' });
      return;
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId!) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }
  res.json({
    user: toUserResponse(user),
    hasActiveParticipation: hasActiveParticipation(user.id),
  });
});

export default router;
