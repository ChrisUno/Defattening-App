import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db.js', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
  requireAdmin: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
}));

import router from '../journals.js';
import pool from '../../db.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /journals', () => {
  it('with sessionId → 200 + mapped entries', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [
        { id: 'j1', user_id: 'u1', session_id: 's1', week_index: 0, content: 'Week 0 notes', created_at: '2025-01-01' },
      ],
    });

    const res = await request(createApp()).get('/?sessionId=s1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual({
      id: 'j1',
      userId: 'u1',
      sessionId: 's1',
      weekIndex: 0,
      content: 'Week 0 notes',
      createdAt: '2025-01-01',
    });
  });
});

describe('POST /journals', () => {
  it('valid body → 201', async () => {
    const journalRow = { id: 'j1', user_id: 'u1', session_id: 's1', week_index: 1, content: 'My journal', created_at: '2025-01-01' };
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [] }) // no existing entry
      .mockResolvedValueOnce({ rows: [] }) // INSERT
      .mockResolvedValueOnce({ rows: [journalRow] }); // SELECT after insert

    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', weekIndex: 1, content: 'My journal' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('My journal');
    expect(res.body.sessionId).toBe('s1');
  });

  it('missing content → 400', async () => {
    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', weekIndex: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'sessionId, weekIndex, and content are required' });
  });

  it('content > 5000 chars → 400', async () => {
    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', weekIndex: 1, content: 'x'.repeat(5001) });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Journal entry cannot exceed 5,000 characters' });
  });

  it('existing entry → updates (200)', async () => {
    const updatedRow = { id: 'j1', user_id: 'u1', session_id: 's1', week_index: 1, content: 'Updated', created_at: '2025-01-02' };
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 'j1' }] }) // existing found
      .mockResolvedValueOnce({ rows: [] }) // UPDATE
      .mockResolvedValueOnce({ rows: [updatedRow] }); // SELECT after update

    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', weekIndex: 1, content: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Updated');
  });
});
