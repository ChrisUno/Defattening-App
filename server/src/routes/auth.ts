import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const toUserResponse = (row: any) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  avatarColor: row.avatar_color,
  role: row.role,
  heightCm: row.height_cm,
  createdAt: row.created_at,
});

const hasActiveParticipation = async (userId: string): Promise<boolean> => {
  const { rows } = await pool.query(
    `SELECT 1 FROM participations p
     JOIN sessions s ON s.id = p.session_id
     WHERE p.user_id = $1 AND s.status IN ('active', 'upcoming')
     LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  req.session.userId = user.id;
  res.json({
    user: toUserResponse(user),
    hasActiveParticipation: await hasActiveParticipation(user.id),
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

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId!]);
  const user = rows[0];
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }
  res.json({
    user: toUserResponse(user),
    hasActiveParticipation: await hasActiveParticipation(user.id),
  });
});

export default router;
