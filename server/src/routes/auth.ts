import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import crypto from 'crypto';

const router = Router();

const ENTRA_TENANT_ID = process.env.ENTRA_TENANT_ID || 'eedd1340-df1a-4db2-8a03-b4cfb1fa3e9d';
const ENTRA_API_CLIENT_ID = process.env.ENTRA_API_CLIENT_ID || '34d4bbb3-6a41-4437-8717-9c07086c8e0a';

const jwksRsaClient = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    jwksRsaClient.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key!.getPublicKey());
    });
  });
}

async function verifyEntraToken(token: string): Promise<any> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) throw new Error('Invalid token');
  const publicKey = await getSigningKey(decoded.header);
  return jwt.verify(token, publicKey, {
    audience: ENTRA_API_CLIENT_ID,
    issuer: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0`,
    algorithms: ['RS256'],
  });
}

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#4F46E5', '#BE185D'];

const toUserResponse = (row: any) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  avatarColor: row.avatar_color,
  role: row.role,
  heightCm: row.height_cm,
  isTempAdmin: row.is_temp_admin,
  tempAdminExpiresAt: row.temp_admin_expires_at,
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

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  req.session.userId = user.id;
  res.json({
    user: toUserResponse(user),
    hasActiveParticipation: await hasActiveParticipation(user.id),
  });
}));

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

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
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
}));

router.post('/entra', asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.slice(7);
    const claims = await verifyEntraToken(token);

    if (claims.tid !== ENTRA_TENANT_ID) {
      res.status(403).json({ message: 'Invalid tenant' });
      return;
    }

    const oid: string = claims.oid;
    const email: string = (claims.preferred_username || claims.email || '').toLowerCase();
    const name: string = claims.name || email.split('@')[0];

    let userRow: any = null;

    const byOid = await pool.query('SELECT * FROM users WHERE entra_oid = $1', [oid]);
    if (byOid.rows.length > 0) {
      userRow = byOid.rows[0];
    } else {
      const byEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (byEmail.rows.length > 0) {
        userRow = byEmail.rows[0];
        if (!userRow.entra_oid) {
          await pool.query('UPDATE users SET entra_oid = $1 WHERE id = $2', [oid, userRow.id]);
          userRow.entra_oid = oid;
        }
      } else {
        const id = crypto.randomUUID();
        const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        const { rows } = await pool.query(
          `INSERT INTO users (id, email, name, avatar_color, role, entra_oid)
           VALUES ($1, $2, $3, $4, 'user', $5)
           RETURNING *`,
          [id, email, name, color, oid]
        );
        userRow = rows[0];
      }
    }

    req.session.userId = userRow.id;
    res.json({
      user: toUserResponse(userRow),
      hasActiveParticipation: await hasActiveParticipation(userRow.id),
    });
  } catch (err: any) {
    console.error('Entra auth error:', err.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
}));

export default router;
