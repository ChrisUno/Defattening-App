import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pool before importing auth module
vi.mock('../../db.js', () => ({
  default: { query: vi.fn() },
}));

import { requireAuth, requireAdmin, requireSuperAdmin } from '../auth.js';
import pool from '../../db.js';

// ─── Mock Express req/res/next ───────────────────────────────────────

function mockReq(sessionData: Record<string, unknown> = {}) {
  return { session: sessionData } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── requireAuth ─────────────────────────────────────────────────────

describe('requireAuth', () => {
  it('userId present → calls next()', () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('no userId → 401 + message', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('undefined session → 401', () => {
    const req = mockReq({ userId: undefined });
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── requireAdmin ────────────────────────────────────────────────────

describe('requireAdmin', () => {
  it('admin user → calls next()', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [{ role: 'admin', is_temp_admin: false, temp_admin_expires_at: null }] });

    await requireAdmin(req, res, next);

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT role, is_temp_admin, temp_admin_expires_at FROM users WHERE id = $1',
      ['u1'],
    );
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('super_admin role → calls next()', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [{ role: 'super_admin', is_temp_admin: false, temp_admin_expires_at: null }] });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('temp admin (no expiry) → calls next()', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({
      rows: [{ role: 'user', is_temp_admin: true, temp_admin_expires_at: null }],
    });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('expired temp admin → clears flag + 403', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    (pool.query as any).mockResolvedValue({
      rows: [{ role: 'user', is_temp_admin: true, temp_admin_expires_at: pastDate }],
    });

    await requireAdmin(req, res, next);

    // SELECT + UPDATE to clear expired flag
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET is_temp_admin = false, temp_admin_expires_at = null WHERE id = $1',
      ['u1'],
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('non-admin user → 403', async () => {
    const req = mockReq({ userId: 'u2' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [{ role: 'user', is_temp_admin: false, temp_admin_expires_at: null }] });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('no session userId → 401 (short-circuit before DB query)', async () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(pool.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('user not found in DB → 401', async () => {
    const req = mockReq({ userId: 'u-deleted' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [] });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('DB query throws → error propagates (no try/catch in middleware)', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();
    const dbError = new Error('connection refused');

    (pool.query as any).mockRejectedValue(dbError);

    await expect(requireAdmin(req, res, next)).rejects.toThrow('connection refused');
    expect(next).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─── requireSuperAdmin ───────────────────────────────────────────────

describe('requireSuperAdmin', () => {
  it('super_admin → calls next()', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [{ role: 'super_admin' }] });

    await requireSuperAdmin(req, res, next);

    expect(pool.query).toHaveBeenCalledWith('SELECT role FROM users WHERE id = $1', ['u1']);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('admin role → 403', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [{ role: 'admin' }] });

    await requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Super admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('no session → 401', async () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    await requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(pool.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('user not found → 403', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [] });

    await requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Super admin access required' });
    expect(next).not.toHaveBeenCalled();
  });
});
