import type { Request, Response, NextFunction } from 'express';
import pool from '../db.js';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const { rows } = await pool.query(
    'SELECT role, is_temp_admin, temp_admin_expires_at FROM users WHERE id = $1',
    [req.session.userId]
  );
  if (!rows[0]) {
    res.status(401).json({ message: 'User not found' });
    return;
  }

  const user = rows[0];
  const isRoleAdmin = ['admin', 'super_admin'].includes(user.role);

  // Check temp admin — auto-expire if past deadline
  let isTempAdmin = user.is_temp_admin;
  if (isTempAdmin && user.temp_admin_expires_at && new Date(user.temp_admin_expires_at) < new Date()) {
    await pool.query('UPDATE users SET is_temp_admin = false, temp_admin_expires_at = null WHERE id = $1', [req.session.userId]);
    isTempAdmin = false;
  }

  if (!isRoleAdmin && !isTempAdmin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
  if (!rows[0] || rows[0].role !== 'super_admin') {
    res.status(403).json({ message: 'Super admin access required' });
    return;
  }
  next();
};
