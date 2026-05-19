import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db.js', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
  requireAdmin: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
}));

import router from '../participations.js';
import pool from '../../db.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
}

const partRow = {
  id: 'p1', user_id: 'u1', session_id: 's1',
  start_weight_kg: 90, goal_weight_kg: 80, joined_at: '2025-01-01',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /participations', () => {
  it('→ 200 with mapped array', async () => {
    (pool.query as any).mockResolvedValue({ rows: [partRow] });

    const res = await request(createApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual({
      id: 'p1', userId: 'u1', sessionId: 's1',
      startWeightKg: 90, goalWeightKg: 80, joinedAt: '2025-01-01',
    });
  });
});

describe('POST /participations', () => {
  it('valid body → 201', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [] }) // no existing
      .mockResolvedValueOnce({ rows: [] }) // INSERT
      .mockResolvedValueOnce({ rows: [partRow] }); // SELECT

    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', startWeightKg: 90, goalWeightKg: 80 });

    expect(res.status).toBe(201);
    expect(res.body.startWeightKg).toBe(90);
  });

  it('missing fields → 400', async () => {
    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/startWeightKg/);
  });
});

describe('PATCH /participations/:id', () => {
  it('not found → 404', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const res = await request(createApp())
      .patch('/p999')
      .send({ startWeightKg: 85 });

    expect(res.status).toBe(404);
  });

  it('valid fields → 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [partRow] }) // existing found
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...partRow, start_weight_kg: 85 }] }); // SELECT

    const res = await request(createApp())
      .patch('/p1')
      .send({ startWeightKg: 85 });

    expect(res.status).toBe(200);
    expect(res.body.startWeightKg).toBe(85);
  });

  it('no fields → 400', async () => {
    (pool.query as any).mockResolvedValue({ rows: [partRow] });

    const res = await request(createApp())
      .patch('/p1')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No valid fields/);
  });
});

describe('DELETE /participations/:id', () => {
  it('not found → 404', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const res = await request(createApp()).delete('/p999');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /participations/:id (found)', () => {
  it('→ 200 cascading delete', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 'p1' }] }) // SELECT
      .mockResolvedValueOnce({ rows: [] }) // DELETE weigh_ins
      .mockResolvedValueOnce({ rows: [] }) // DELETE journals
      .mockResolvedValueOnce({ rows: [] }); // DELETE participations

    const res = await request(createApp()).delete('/p1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('POST /participations/admin', () => {
  it('missing userId → 400', async () => {
    const res = await request(createApp())
      .post('/admin')
      .send({ sessionId: 's1', startWeightKg: 90, goalWeightKg: 80 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/userId/);
  });

  it('valid admin join → 201', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 'u2' }] }) // user check
      .mockResolvedValueOnce({ rows: [] }) // no existing participation
      .mockResolvedValueOnce({ rows: [] }) // INSERT
      .mockResolvedValueOnce({ rows: [partRow] }); // SELECT

    const res = await request(createApp())
      .post('/admin')
      .send({ userId: 'u2', sessionId: 's1', startWeightKg: 90, goalWeightKg: 80 });

    expect(res.status).toBe(201);
  });

  it('user not found → 404', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] }); // user check fails

    const res = await request(createApp())
      .post('/admin')
      .send({ userId: 'u-bad', sessionId: 's1', startWeightKg: 90, goalWeightKg: 80 });

    expect(res.status).toBe(404);
  });

  it('existing participation → updates (200)', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 'u2' }] }) // user check
      .mockResolvedValueOnce({ rows: [partRow] }) // existing found
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [partRow] }); // SELECT

    const res = await request(createApp())
      .post('/admin')
      .send({ userId: 'u2', sessionId: 's1', startWeightKg: 85, goalWeightKg: 75 });

    expect(res.status).toBe(200);
  });
});

describe('POST /participations (existing → update)', () => {
  it('existing participation → updates (200)', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [partRow] }) // existing found
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [partRow] }); // SELECT

    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', startWeightKg: 88, goalWeightKg: 78 });

    expect(res.status).toBe(200);
  });
});
