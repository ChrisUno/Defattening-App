import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db.js', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
  requireAdmin: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
  requireSuperAdmin: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
}));

import router from '../users.js';
import pool from '../../db.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
}

const userRow = {
  id: 'u2', email: 'test@example.com', name: 'Test User',
  avatar_color: '#2563EB', role: 'user', height_cm: 175,
  is_temp_admin: false, temp_admin_expires_at: null, created_at: '2025-01-01',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /users', () => {
  it('→ 200 with camelCase mapping', async () => {
    (pool.query as any).mockResolvedValue({ rows: [userRow] });

    const res = await request(createApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body[0].avatarColor).toBe('#2563EB');
    expect(res.body[0].heightCm).toBe(175);
  });
});

describe('POST /users', () => {
  it('valid body → 201', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [] }) // no duplicate
      .mockResolvedValueOnce({ rows: [] }) // INSERT
      .mockResolvedValueOnce({ rows: [userRow] }); // SELECT

    const res = await request(createApp())
      .post('/')
      .send({ name: 'Test User', email: 'test@example.com', password: 'pw123' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test User');
  });

  it('missing name → 400', async () => {
    const res = await request(createApp())
      .post('/')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Name and email/);
  });

  it('duplicate email → 409', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

    const res = await request(createApp())
      .post('/')
      .send({ name: 'Dup', email: 'test@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/);
  });
});

describe('PATCH /users/:id/role', () => {
  it('valid role → 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ role: 'user' }] }) // target lookup
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...userRow, role: 'admin' }] }); // SELECT

    const res = await request(createApp())
      .patch('/u2/role')
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('invalid role → 400', async () => {
    const res = await request(createApp())
      .patch('/u2/role')
      .send({ role: 'super_admin' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Role must be/);
  });
});

describe('PATCH /users/:id (self-update)', () => {
  it('self can update name → 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ ...userRow, id: 'u1' }] }) // target = self
      .mockResolvedValueOnce({ rows: [{ role: 'user' }] }) // caller role
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...userRow, id: 'u1', name: 'New Name' }] }); // SELECT

    const res = await request(createApp())
      .patch('/u1')
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });
});

describe('PATCH /users/:id (admin editing other user)', () => {
  it('admin can update email → 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] }) // target lookup
      .mockResolvedValueOnce({ rows: [{ role: 'admin' }] }) // caller is admin
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...userRow, email: 'new@example.com' }] }); // SELECT

    const res = await request(createApp())
      .patch('/u2')
      .send({ email: 'new@example.com' });

    expect(res.status).toBe(200);
  });

  it('non-admin non-self → 403', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] }) // target
      .mockResolvedValueOnce({ rows: [{ role: 'user' }] }); // caller is regular user

    const res = await request(createApp())
      .patch('/u2')
      .send({ name: 'Hacker' });

    expect(res.status).toBe(403);
  });

  it('target not found → 404', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const res = await request(createApp())
      .patch('/u999')
      .send({ name: 'Nobody' });

    expect(res.status).toBe(404);
  });

  it('no valid fields → 400', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [userRow] }) // target
      .mockResolvedValueOnce({ rows: [{ role: 'user' }] }); // caller not admin, not self → would 403

    // For self with empty body:
    (pool.query as any).mockReset();
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ ...userRow, id: 'u1' }] }) // target = self
      .mockResolvedValueOnce({ rows: [{ role: 'user' }] }); // caller

    const res = await request(createApp())
      .patch('/u1')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No valid fields/);
  });
});

describe('PATCH /users/:id/temp-admin', () => {
  it('toggle on → 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ role: 'user' }] }) // target
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...userRow, is_temp_admin: true }] }); // SELECT

    const res = await request(createApp())
      .patch('/u2/temp-admin')
      .send({ isTempAdmin: true });

    expect(res.status).toBe(200);
    expect(res.body.isTempAdmin).toBe(true);
  });

  it('invalid isTempAdmin → 400', async () => {
    const res = await request(createApp())
      .patch('/u2/temp-admin')
      .send({ isTempAdmin: 'yes' });

    expect(res.status).toBe(400);
  });

  it('super_admin target → 403', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ role: 'super_admin' }] });

    const res = await request(createApp())
      .patch('/u2/temp-admin')
      .send({ isTempAdmin: true });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /users/:id/role (more branches)', () => {
  it('self-change → 403', async () => {
    const res = await request(createApp())
      .patch('/u1/role') // u1 is session userId from mock
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot change your own role/);
  });

  it('target not found → 404', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const res = await request(createApp())
      .patch('/u999/role')
      .send({ role: 'admin' });

    expect(res.status).toBe(404);
  });

  it('target is super_admin → 403', async () => {
    (pool.query as any).mockResolvedValue({ rows: [{ role: 'super_admin' }] });

    const res = await request(createApp())
      .patch('/u2/role')
      .send({ role: 'user' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot modify a super admin/);
  });
});

describe('DELETE /users/:id', () => {
  it('→ 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 'u2', role: 'user' }] }) // SELECT
      .mockResolvedValueOnce({ rows: [] }); // DELETE

    const res = await request(createApp()).delete('/u2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('super_admin → 403', async () => {
    (pool.query as any).mockResolvedValue({ rows: [{ id: 'u2', role: 'super_admin' }] });

    const res = await request(createApp()).delete('/u2');

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot delete/);
  });
});
