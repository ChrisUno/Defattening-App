import { describe, it, expect } from 'vitest';
import {
  carryForwardWeights,
  weeklyPointsFor,
  computeParticipantStats,
  computeLeaderboard,
  findRival,
  findPursuer,
  computeRanksForSession,
  currentWeekIndex,
  userHasWeighedInThisWeek,
  formatKg,
  formatPct,
  formatSignedKg,
} from '../stats';
import type { User, Session, Participation, WeighIn, ParticipantStats } from '../../types';

// ─── longestLossStreak is not exported, but exercised through computeParticipantStats ──

// ─── Shared fixtures ─────────────────────────────────────────────────

const session: Session = {
  id: 's1',
  name: 'Test Session',
  description: '',
  weeks: 8,
  weighInDayOfWeek: 1,
  weighInNote: '',
  startDate: '2026-04-20', // 4 weeks ago from ~2026-05-18
  status: 'active',
  createdBy: 'u1',
};

const users: User[] = [
  { id: 'u1', email: 'a@test.com', name: 'Alice', avatarColor: '#f00', role: 'admin', createdAt: '2026-01-01' },
  { id: 'u2', email: 'b@test.com', name: 'Bob', avatarColor: '#0f0', role: 'user', createdAt: '2026-01-01' },
  { id: 'u3', email: 'c@test.com', name: 'Charlie', avatarColor: '#00f', role: 'user', createdAt: '2026-01-01' },
];

const mkPart = (userId: string, startKg: number, goalKg: number): Participation => ({
  id: `part-${userId}`,
  userId,
  sessionId: 's1',
  startWeightKg: startKg,
  goalWeightKg: goalKg,
  joinedAt: '2026-04-20',
});

const mkWI = (userId: string, week: number, kg: number): WeighIn => ({
  id: `wi-${userId}-${week}`,
  userId,
  sessionId: 's1',
  weightKg: kg,
  weekIndex: week,
  measuredAt: '2026-04-20',
  recordedAt: '2026-04-20',
});

const participations: Participation[] = [
  mkPart('u1', 100, 85), // Alice: 100 kg start
  mkPart('u2', 90, 80),  // Bob: 90 kg start
  mkPart('u3', 80, 70),  // Charlie: 80 kg start
];

// Alice: logged weeks 0, 1, 2, 3 — steady loss
// Bob: logged weeks 0, 2 (gap at 1) — bigger drops
// Charlie: logged weeks 0, 1, 2 with a gain in week 2
const weighIns: WeighIn[] = [
  mkWI('u1', 0, 100), mkWI('u1', 1, 99), mkWI('u1', 2, 98), mkWI('u1', 3, 97),
  mkWI('u2', 0, 90),  mkWI('u2', 2, 87),
  mkWI('u3', 0, 80),  mkWI('u3', 1, 79), mkWI('u3', 2, 79.5),
];

// ─── carryForwardWeights ─────────────────────────────────────────────

describe('carryForwardWeights', () => {
  it('fills gap at week 1 by carrying forward week 0 value', () => {
    // Bob: logged 0 (90) and 2 (87), gap at 1
    const weights = carryForwardWeights(participations[1], weighIns, 2);
    expect(weights).toEqual([90, 90, 87]); // week 1 carries from week 0
  });

  it('user with no weigh-ins → all weeks = startWeightKg', () => {
    const emptyPart = mkPart('u-none', 95, 80);
    const weights = carryForwardWeights(emptyPart, weighIns, 3);
    expect(weights).toEqual([95, 95, 95, 95]);
  });

  it('week 0 missing but later weeks present → week 0 = startWeightKg', () => {
    const part = mkPart('u-late', 100, 85);
    const lateWeighIns = [mkWI('u-late', 1, 98), mkWI('u-late', 2, 97)];
    const weights = carryForwardWeights(part, lateWeighIns, 2);
    expect(weights[0]).toBe(100); // startWeightKg used for week 0
    expect(weights[1]).toBe(98);  // actual value
    expect(weights[2]).toBe(97);
  });
});

// ─── weeklyPointsFor ─────────────────────────────────────────────────

describe('weeklyPointsFor', () => {
  it('week 0 → delta is 0, pctFromStart is 0', () => {
    const points = weeklyPointsFor(participations[0], weighIns, 0);
    expect(points).toHaveLength(1);
    // week 0: prev = start = 100, w = 100 → delta = 0, pctFromStart = 0
    expect(points[0].delta).toBe(0);
    expect(points[0].pctFromStart).toBe(0);
  });

  it('3 weeks of steady loss → pctFromStart increases, positive deltas', () => {
    const points = weeklyPointsFor(participations[0], weighIns, 3);
    expect(points).toHaveLength(4); // weeks 0-3

    // pctFromStart should increase each week (more weight lost)
    for (let i = 1; i < points.length; i++) {
      expect(points[i].pctFromStart).toBeGreaterThan(points[i - 1].pctFromStart);
    }

    // Week 1: (100-99)/100 * 100 = 1%
    expect(points[1].pctFromStart).toBeCloseTo(1.0, 5);
    // Week 3: (100-97)/100 * 100 = 3%
    expect(points[3].pctFromStart).toBeCloseTo(3.0, 5);
  });

  it('weight gain week → negative delta, pctFromStart decreases', () => {
    // Charlie: 80 → 79 → 79.5 (gained in week 2)
    const points = weeklyPointsFor(participations[2], weighIns, 2);

    // Week 2 delta: (79 - 79.5) / 79 * 100 ≈ -0.633 (negative = gained weight)
    expect(points[2].delta).toBeLessThan(0);
    // pctFromStart week 2 < week 1
    expect(points[2].pctFromStart).toBeLessThan(points[1].pctFromStart);
  });
});

// ─── longestLossStreak (tested via computeParticipantStats) ──────────

describe('longestLossStreak (via computeParticipantStats)', () => {
  it('3 consecutive losses at tail → streak = 3', () => {
    // Alice: 100→99→98→97, 3 consecutive drops
    const stats = computeParticipantStats(users[0], participations[0], weighIns, 3);
    expect(stats.currentLossStreak).toBe(3);
  });

  it('loss broken by gain at end → streak = 0', () => {
    // Charlie: 80→79→79.5 — last change is a gain
    const stats = computeParticipantStats(users[2], participations[2], weighIns, 2);
    expect(stats.currentLossStreak).toBe(0);
  });

  it('single-point (week 0 only) → streak = 0', () => {
    const stats = computeParticipantStats(users[0], participations[0], weighIns, 0);
    expect(stats.currentLossStreak).toBe(0);
  });

  it('no weigh-ins → streak = 0', () => {
    const noUser: User = { id: 'u-none', email: 'x@test.com', name: 'X', avatarColor: '#999', role: 'user', createdAt: '2026-01-01' };
    const noPart = mkPart('u-none', 95, 80);
    const stats = computeParticipantStats(noUser, noPart, [], 2);
    expect(stats.currentLossStreak).toBe(0);
  });
});

// ─── computeParticipantStats ─────────────────────────────────────────

describe('computeParticipantStats', () => {
  it('user with mixed weeks → correct stats', () => {
    // Alice: 100→99→98→97 over weeks 0-3
    const stats = computeParticipantStats(users[0], participations[0], weighIns, 3);

    // cumulativePct = (100-97)/100 * 100 = 3%
    expect(stats.cumulativePct).toBeCloseTo(3.0, 1);
    // weeklyDelta = (98-97)/98 * 100 ≈ 1.02%
    expect(stats.weeklyDelta).toBeCloseTo(1.02, 1);
    expect(stats.currentWeightKg).toBe(97);
    expect(stats.startWeightKg).toBe(100);
    expect(stats.weeksLogged).toBe(4);
    // bestWeekLoss = max delta across weeks 1-3
    // week 1: (100-99)/100=1.0, week 2: (99-98)/99≈1.0101, week 3: (98-97)/98≈1.0204
    expect(stats.bestWeekLoss).toBeCloseTo(1.0204, 2);
  });

  it('user with no weigh-ins → cumulativePct=0, currentWeightKg=startWeight', () => {
    const noUser: User = { id: 'u-none', email: 'x@test.com', name: 'X', avatarColor: '#999', role: 'user', createdAt: '2026-01-01' };
    const noPart = mkPart('u-none', 95, 80);
    const stats = computeParticipantStats(noUser, noPart, [], 2);

    expect(stats.cumulativePct).toBe(0);
    expect(stats.currentWeightKg).toBe(95);
    expect(stats.weeksLogged).toBe(0);
  });
});

// ─── computeLeaderboard ──────────────────────────────────────────────

describe('computeLeaderboard', () => {
  it('3 participants sorted by cumulativePct descending', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    expect(board).toHaveLength(3);

    // Verify descending order
    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].cumulativePct).toBeGreaterThanOrEqual(board[i].cumulativePct);
    }
  });

  it('user not found in users list → filtered out (no crash)', () => {
    const partialUsers = [users[0]]; // only Alice
    const board = computeLeaderboard(session, partialUsers, participations, weighIns, 3);
    expect(board).toHaveLength(1);
    expect(board[0].userId).toBe('u1');
  });
});

// ─── findRival ───────────────────────────────────────────────────────

describe('findRival', () => {
  it('user in 2nd place → returns 1st place as rival', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
    const secondPlace = sorted[1];
    const result = findRival(board, secondPlace.userId);

    expect(result).not.toBeNull();
    expect(result!.rival.userId).toBe(sorted[0].userId);
    expect(result!.gap).toBeCloseTo(sorted[0].cumulativePct - secondPlace.cumulativePct, 5);
    expect(result!.userRank).toBe(2);
  });

  it('user in 1st place → returns null', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
    expect(findRival(board, sorted[0].userId)).toBeNull();
  });

  it('user not in board → returns null', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    expect(findRival(board, 'u-nonexistent')).toBeNull();
  });
});

// ─── findPursuer ─────────────────────────────────────────────────────

describe('findPursuer', () => {
  it('user in 1st place → returns 2nd place as pursuer', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
    const first = sorted[0];
    const result = findPursuer(board, first.userId);

    expect(result).not.toBeNull();
    expect(result!.pursuer.userId).toBe(sorted[1].userId);
    expect(result!.gap).toBeCloseTo(first.cumulativePct - sorted[1].cumulativePct, 5);
  });

  it('user in last place → returns null', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
    const last = sorted[sorted.length - 1];
    expect(findPursuer(board, last.userId)).toBeNull();
  });

  it('user not in board → returns null', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    expect(findPursuer(board, 'u-nonexistent')).toBeNull();
  });
});

// ─── computeRanksForSession ──────────────────────────────────────────

describe('computeRanksForSession', () => {
  it('3 participants → correct rank map {userId: rank}', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const ranks = computeRanksForSession(board);

    const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
    sorted.forEach((p, i) => {
      expect(ranks[p.userId]).toBe(i + 1);
    });
  });
});

// ─── currentWeekIndex ────────────────────────────────────────────────

describe('currentWeekIndex', () => {
  it('session started 2 weeks ago → returns 2', () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const sess: Session = {
      ...session,
      startDate: twoWeeksAgo.toISOString().slice(0, 10),
      weeks: 8,
    };
    const idx = currentWeekIndex(sess, new Date());
    expect(idx).toBe(2);
  });

  it('before session starts → clamped to 0', () => {
    const futureSession: Session = { ...session, startDate: '2099-01-01' };
    expect(currentWeekIndex(futureSession, new Date())).toBe(0);
  });

  it('beyond session end → clamped to weeks-1', () => {
    const pastSession: Session = { ...session, startDate: '2020-01-01', weeks: 4 };
    expect(currentWeekIndex(pastSession, new Date())).toBe(3); // weeks-1
  });
});

// ─── userHasWeighedInThisWeek ────────────────────────────────────────

describe('userHasWeighedInThisWeek', () => {
  it('has weigh-in → true', () => {
    expect(userHasWeighedInThisWeek('u1', 's1', 0, weighIns)).toBe(true);
  });

  it('no weigh-in → false', () => {
    expect(userHasWeighedInThisWeek('u1', 's1', 7, weighIns)).toBe(false);
  });
});

// ─── formatKg ────────────────────────────────────────────────────────

describe('formatKg', () => {
  it('null → "—"', () => {
    expect(formatKg(null)).toBe('—');
  });

  it('undefined → "—"', () => {
    expect(formatKg(undefined)).toBe('—');
  });

  it('85.3 → "85.3 kg"', () => {
    expect(formatKg(85.3)).toBe('85.3 kg');
  });
});

// ─── formatPct ───────────────────────────────────────────────────────

describe('formatPct', () => {
  it('positive → no sign prefix', () => {
    expect(formatPct(3.14)).toBe('3.14%');
  });

  it('negative → − prefix (unicode minus)', () => {
    expect(formatPct(-2.5)).toBe('−2.50%');
  });

  it('zero → "0.00%"', () => {
    expect(formatPct(0)).toBe('0.00%');
  });
});

// ─── formatSignedKg ──────────────────────────────────────────────────

describe('formatSignedKg', () => {
  it('positive (lost weight) → "−X.X kg" (inverted sign)', () => {
    // positive kg means weight lost → displayed as minus
    expect(formatSignedKg(2.5)).toBe('−2.5 kg');
  });

  it('negative (gained weight) → "+X.X kg" (inverted sign)', () => {
    expect(formatSignedKg(-1.3)).toBe('+1.3 kg');
  });

  it('zero → "0.0 kg"', () => {
    expect(formatSignedKg(0)).toBe('0.0 kg');
  });
});
