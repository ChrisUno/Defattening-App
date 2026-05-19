import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db.js', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
  requireAdmin: (_req: any, _res: any, next: any) => { _req.session = { userId: 'u1' }; next(); },
}));
vi.mock('../../lib/stats.js', () => ({
  computeLeaderboard: vi.fn(() => []),
  computeRanksForSession: vi.fn(() => ({})),
  currentWeekIndex: vi.fn(() => 1),
}));

import router from '../weighIns.js';
import pool from '../../db.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
}

const wiRow = {
  id: 'w1', user_id: 'u1', session_id: 's1', weight_kg: 88.5,
  body_fat_pct: 22.1, week_index: 1, measured_at: '2025-01-13', recorded_at: '2025-01-13',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /weighIns', () => {
  it('with sessionId → 200 + mapped', async () => {
    (pool.query as any).mockResolvedValue({ rows: [wiRow] });

    const res = await request(createApp()).get('/?sessionId=s1');

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual({
      id: 'w1', userId: 'u1', sessionId: 's1', weightKg: 88.5,
      bodyFatPct: 22.1, weekIndex: 1, measuredAt: '2025-01-13', recordedAt: '2025-01-13',
    });
  });

  it('without sessionId → 400', async () => {
    const res = await request(createApp()).get('/');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sessionId/);
  });
});

describe('POST /weighIns', () => {
  it('valid body → 200 with weighIn + overtakes', async () => {
    // Mock sequence for POST handler:
    // 1. getLeaderboardData: session query
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 's1', start_date: '2025-01-06', weeks: 12 }] })
      // 2. getLeaderboardData: users query
      .mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'User 1', avatar_color: '#2563EB' }] })
      // 3. getLeaderboardData: participations query
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', session_id: 's1', start_weight_kg: 90, goal_weight_kg: 80 }] })
      // 4. getLeaderboardData: weighIns query
      .mockResolvedValueOnce({ rows: [] })
      // 5. SELECT existing weigh-in
      .mockResolvedValueOnce({ rows: [] })
      // 6. INSERT weigh-in
      .mockResolvedValueOnce({ rows: [] })
      // 7. getLeaderboardData after (session)
      .mockResolvedValueOnce({ rows: [{ id: 's1', start_date: '2025-01-06', weeks: 12 }] })
      // 8. getLeaderboardData after (users)
      .mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'User 1', avatar_color: '#2563EB' }] })
      // 9. getLeaderboardData after (participations)
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', session_id: 's1', start_weight_kg: 90, goal_weight_kg: 80 }] })
      // 10. getLeaderboardData after (weighIns)
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', session_id: 's1', weight_kg: 88.5, body_fat_pct: null, week_index: 1 }] })
      // 11. SELECT final weigh-in
      .mockResolvedValueOnce({ rows: [wiRow] });

    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', weightKg: 88.5, weekIndex: 1 });

    expect(res.status).toBe(200);
    expect(res.body.weighIn.weightKg).toBe(88.5);
    expect(res.body.overtakes).toEqual([]);
  });

  it('missing fields → 400', async () => {
    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/weightKg/);
  });

  it('session not found → 404', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] }); // no session

    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's999', weightKg: 88, weekIndex: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Session not found/);
  });

  it('updates existing weigh-in → 200', async () => {
    (pool.query as any)
      // getLeaderboardData before: session, users, participations, weighIns
      .mockResolvedValueOnce({ rows: [{ id: 's1', start_date: '2025-01-06', weeks: 12 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'User 1', avatar_color: '#2563EB' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', session_id: 's1', start_weight_kg: 90, goal_weight_kg: 80 }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', session_id: 's1', weight_kg: 89, body_fat_pct: null, week_index: 1 }] })
      // existing weigh-in found
      .mockResolvedValueOnce({ rows: [{ id: 'w1' }] })
      // UPDATE
      .mockResolvedValueOnce({ rows: [] })
      // getLeaderboardData after: session, users, participations, weighIns
      .mockResolvedValueOnce({ rows: [{ id: 's1', start_date: '2025-01-06', weeks: 12 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'User 1', avatar_color: '#2563EB' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', session_id: 's1', start_weight_kg: 90, goal_weight_kg: 80 }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', session_id: 's1', weight_kg: 88, body_fat_pct: null, week_index: 1 }] })
      // SELECT final weigh-in
      .mockResolvedValueOnce({ rows: [{ ...wiRow, weight_kg: 88 }] });

    const res = await request(createApp())
      .post('/')
      .send({ sessionId: 's1', weightKg: 88, weekIndex: 1 });

    expect(res.status).toBe(200);
    expect(res.body.weighIn.weightKg).toBe(88);
  });
});

describe('GET /weighIns/status', () => {
  it('→ 200 with statuses', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({
        rows: [{ session_id: 's1', start_date: '2025-01-06', weeks: 12, weigh_in_day_of_week: 1 }],
      })
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] }); // weigh-in exists

    const res = await request(createApp()).get('/status');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual(expect.objectContaining({
      sessionId: 's1',
      hasWeighedIn: true,
    }));
  });
});
