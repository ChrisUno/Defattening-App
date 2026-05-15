import type { Request, Response, NextFunction } from 'express';
import db from '../db.js';

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

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId) as { role: string } | undefined;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};
