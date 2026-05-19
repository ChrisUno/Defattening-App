import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db.js', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
  requireAdmin: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
}));

import router from '../activity.js';
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

describe('GET /activity', () => {
  it('with sessionId → 200 + mapped array', async () => {
    (pool.query as any).mockResolvedValue({
      rows: [
        { id: 'a1', type: 'overtake', occurred_at: '2025-01-01', session_id: 's1', actor_user_id: 'u1', target_user_id: 'u2', actor_pct: 5.2, target_pct: 4.1 },
        { id: 'a2', type: 'overtake', occurred_at: '2025-01-02', session_id: 's1', actor_user_id: 'u2', target_user_id: 'u1', actor_pct: 6.0, target_pct: 5.5 },
      ],
    });

    const res = await request(createApp()).get('/?sessionId=s1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual({
      id: 'a1',
      type: 'overtake',
      occurredAt: '2025-01-01',
      sessionId: 's1',
      actorUserId: 'u1',
      targetUserId: 'u2',
      actorPct: 5.2,
      targetPct: 4.1,
    });
  });

  it('without sessionId → 400', async () => {
    const res = await request(createApp()).get('/');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'sessionId query param is required' });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
