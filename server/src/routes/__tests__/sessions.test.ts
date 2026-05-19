import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db.js', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
  requireAdmin: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
}));

import router from '../sessions.js';
import pool from '../../db.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
}

const sessionRow = {
  id: 's1', name: 'Spring 2025', description: 'Test', weeks: 12,
  weigh_in_day_of_week: 1, weigh_in_note: '', start_date: '2025-01-06',
  status: 'active', created_by: 'u1',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /sessions', () => {
  it('→ 200 with mapped sessions', async () => {
    (pool.query as any).mockResolvedValue({ rows: [sessionRow] });

    const res = await request(createApp()).get('/');

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual({
      id: 's1', name: 'Spring 2025', description: 'Test', weeks: 12,
      weighInDayOfWeek: 1, weighInNote: '', startDate: '2025-01-06',
      status: 'active', createdBy: 'u1',
    });
  });
});

describe('POST /sessions', () => {
  it('valid body → 201', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [] }) // INSERT
      .mockResolvedValueOnce({ rows: [sessionRow] }); // SELECT

    const res = await request(createApp())
      .post('/')
      .send({ name: 'Spring 2025', weeks: 12, startDate: '2025-01-06' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Spring 2025');
  });

  it('missing name → 400', async () => {
    const res = await request(createApp())
      .post('/')
      .send({ weeks: 12, startDate: '2025-01-06' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Name/);
  });
});

describe('PATCH /sessions/:id', () => {
  it('not found → 404', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const res = await request(createApp())
      .patch('/s999')
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('valid update → 200', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 's1' }] }) // existing
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ ...sessionRow, name: 'Updated' }] }); // SELECT

    const res = await request(createApp())
      .patch('/s1')
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });
});

describe('DELETE /sessions/:id', () => {
  it('→ 200 cascading delete', async () => {
    (pool.query as any).mockResolvedValue({ rows: [{ id: 's1' }] });

    const res = await request(createApp()).delete('/s1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    // 1 SELECT + 5 DELETEs (activity, journals, weigh_ins, participations, sessions)
    expect(pool.query).toHaveBeenCalledTimes(6);
  });

  it('not found → 404', async () => {
    (pool.query as any).mockResolvedValue({ rows: [] });

    const res = await request(createApp()).delete('/s999');

    expect(res.status).toBe(404);
  });
});
