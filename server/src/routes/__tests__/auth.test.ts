import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ─── Mocks (hoisted before imports) ─────────────────────────────────

vi.mock('../../db.js', () => ({ default: { query: vi.fn() } }));

// requireAuth passthrough — preserves session object (needed for destroy in /logout)
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => {
    _req.session.userId = 'u1';
    next();
  },
}));

vi.mock('bcryptjs', () => ({
  default: { compareSync: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    decode: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock('jwks-rsa', () => ({
  default: vi.fn(() => ({
    getSigningKey: vi.fn((_kid: string, cb: any) => {
      cb(null, { getPublicKey: () => 'mock-public-key' });
    }),
  })),
}));

import router from '../auth.js';
import pool from '../../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Helpers ────────────────────────────────────────────────────────

function createApp({ destroyError }: { destroyError?: Error | null } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    req.session = {
      userId: undefined as string | undefined,
      destroy: vi.fn((cb: any) => cb(destroyError || null)),
    };
    next();
  });
  app.use('/', router);
  return app;
}

const userRow = {
  id: 'u1', email: 'test@example.com', name: 'Test User',
  password_hash: '$2a$10$hashedpassword',
  avatar_color: '#2563EB', role: 'user', height_cm: 175,
  is_temp_admin: false, temp_admin_expires_at: null,
  entra_oid: null, created_at: '2025-01-01',
};

const validClaims = {
  oid: 'oid-123',
  tid: 'eedd1340-df1a-4db2-8a03-b4cfb1fa3e9d',
  preferred_username: 'test@example.com',
  name: 'Test User',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── POST /login ────────────────────────────────────────────────────

describe('POST /login', () => {
  it('valid credentials → 200 with user + hasActiveParticipation', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] })       // SELECT user
      .mockResolvedValueOnce({ rows: [] });              // hasActiveParticipation

    (bcrypt.compareSync as any).mockReturnValue(true);

    const res = await request(createApp())
      .post('/login')
      .send({ email: 'test@example.com', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.hasActiveParticipation).toBe(false);
  });

  it('missing email → 400', async () => {
    const res = await request(createApp())
      .post('/login')
      .send({ password: 'pw' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/);
  });

  it('missing password → 400', async () => {
    const res = await request(createApp())
      .post('/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/);
  });

  it('user not found → 401', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const res = await request(createApp())
      .post('/login')
      .send({ email: 'nobody@example.com', password: 'pw' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('SSO-only user (no password_hash) → 401', async () => {
    (pool.query as any).mockResolvedValueOnce({
      rows: [{ ...userRow, password_hash: null }],
    });

    const res = await request(createApp())
      .post('/login')
      .send({ email: 'test@example.com', password: 'pw' });

    expect(res.status).toBe(401);
    expect(bcrypt.compareSync).not.toHaveBeenCalled();
  });

  it('wrong password → 401', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [userRow] });
    (bcrypt.compareSync as any).mockReturnValue(false);

    const res = await request(createApp())
      .post('/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('email trimmed + lowercased', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] })
      .mockResolvedValueOnce({ rows: [] });

    (bcrypt.compareSync as any).mockReturnValue(true);

    await request(createApp())
      .post('/login')
      .send({ email: '  TEST@Example.COM  ', password: 'pw' });

    expect((pool.query as any).mock.calls[0][1]).toEqual(['test@example.com']);
  });
});

// ─── POST /logout ───────────────────────────────────────────────────

describe('POST /logout', () => {
  it('success → 200 { ok: true }', async () => {
    const res = await request(createApp()).post('/logout');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('session destroy error → 500', async () => {
    const res = await request(createApp({ destroyError: new Error('boom') }))
      .post('/logout');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Failed to logout');
  });
});

// ─── GET /me ────────────────────────────────────────────────────────

describe('GET /me', () => {
  it('valid session → 200 with user + hasActiveParticipation', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] })          // SELECT user
      .mockResolvedValueOnce({ rows: [{ '1': 1 }] });      // hasActiveParticipation

    const res = await request(createApp()).get('/me');

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.hasActiveParticipation).toBe(true);
  });

  it('user deleted from DB → 401', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const res = await request(createApp()).get('/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('User not found');
  });

  it('maps snake_case → camelCase', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(createApp()).get('/me');

    expect(res.body.user).toMatchObject({
      avatarColor: '#2563EB',
      heightCm: 175,
      isTempAdmin: false,
      tempAdminExpiresAt: null,
    });
  });
});

// ─── POST /entra ────────────────────────────────────────────────────

describe('POST /entra', () => {
  function setupValidToken(claimsOverride?: Partial<typeof validClaims>) {
    const claims = { ...validClaims, ...claimsOverride };
    (jwt.decode as any).mockReturnValue({
      header: { kid: 'mock-kid', alg: 'RS256' },
      payload: claims,
    });
    (jwt.verify as any).mockReturnValue(claims);
  }

  it('no Authorization header → 401', async () => {
    const res = await request(createApp()).post('/entra');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('auth header without "Bearer " → 401', async () => {
    const res = await request(createApp())
      .post('/entra')
      .set('Authorization', 'Token xyz');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('invalid token (decode returns null) → 401', async () => {
    (jwt.decode as any).mockReturnValue(null);

    const res = await request(createApp())
      .post('/entra')
      .set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication failed');
  });

  it('token verification fails → 401', async () => {
    (jwt.decode as any).mockReturnValue({
      header: { kid: 'mock-kid', alg: 'RS256' },
      payload: validClaims,
    });
    (jwt.verify as any).mockImplementation(() => { throw new Error('invalid sig'); });

    const res = await request(createApp())
      .post('/entra')
      .set('Authorization', 'Bearer bad-sig-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication failed');
  });

  it('wrong tenant ID → 403', async () => {
    setupValidToken({ tid: 'wrong-tenant-id' });

    const res = await request(createApp())
      .post('/entra')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Invalid tenant');
  });

  it('existing user by OID → 200', async () => {
    setupValidToken();
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] })   // byOid
      .mockResolvedValueOnce({ rows: [] });          // hasActiveParticipation

    const res = await request(createApp())
      .post('/entra')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('existing user by email, no OID → links OID', async () => {
    setupValidToken();
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [] })                                // byOid — empty
      .mockResolvedValueOnce({ rows: [{ ...userRow, entra_oid: null }] }) // byEmail — found
      .mockResolvedValueOnce({ rows: [] })                                // UPDATE entra_oid
      .mockResolvedValueOnce({ rows: [] });                               // hasActiveParticipation

    const res = await request(createApp())
      .post('/entra')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    // Verify UPDATE was called with OID
    const updateCall = (pool.query as any).mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('UPDATE')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[1]).toContain('oid-123');
  });

  it('new user auto-created → 200', async () => {
    setupValidToken();
    const newUser = { ...userRow, id: 'new-uuid', entra_oid: 'oid-123' };
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [] })          // byOid — empty
      .mockResolvedValueOnce({ rows: [] })          // byEmail — empty
      .mockResolvedValueOnce({ rows: [newUser] })   // INSERT RETURNING
      .mockResolvedValueOnce({ rows: [] });         // hasActiveParticipation

    const res = await request(createApp())
      .post('/entra')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    // Verify INSERT was called
    const insertCall = (pool.query as any).mock.calls.find(
      (call: any[]) => typeof call[0] === 'string' && call[0].includes('INSERT')
    );
    expect(insertCall).toBeDefined();
  });
});
