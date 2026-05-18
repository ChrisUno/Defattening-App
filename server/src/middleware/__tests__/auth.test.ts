import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pool before importing auth module
vi.mock('../../db.js', () => ({
  default: { query: vi.fn() },
}));

import { requireAuth, requireAdmin } from '../auth.js';
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
    // session object exists (Express always creates it) but userId undefined
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

    (pool.query as any).mockResolvedValue({ rows: [{ role: 'admin' }] });

    await requireAdmin(req, res, next);

    expect(pool.query).toHaveBeenCalledWith('SELECT role FROM users WHERE id = $1', ['u1']);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('non-admin user → 403', async () => {
    const req = mockReq({ userId: 'u2' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [{ role: 'user' }] });

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
    expect(pool.query).not.toHaveBeenCalled(); // no DB hit
    expect(next).not.toHaveBeenCalled();
  });

  it('user not found in DB → 403', async () => {
    const req = mockReq({ userId: 'u-deleted' });
    const res = mockRes();
    const next = vi.fn();

    (pool.query as any).mockResolvedValue({ rows: [] }); // empty result

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('DB query throws → error propagates (no try/catch in middleware)', async () => {
    const req = mockReq({ userId: 'u1' });
    const res = mockRes();
    const next = vi.fn();
    const dbError = new Error('connection refused');

    (pool.query as any).mockRejectedValue(dbError);

    // requireAdmin has no try/catch — the rejection propagates.
    // In production, Express catches this only if wrapped in asyncHandler.
    await expect(requireAdmin(req, res, next)).rejects.toThrow('connection refused');
    expect(next).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
