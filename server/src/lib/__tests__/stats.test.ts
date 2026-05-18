import { describe, it, expect } from 'vitest';
import {
  computeLeaderboard,
  computeRanksForSession,
  currentWeekIndex,
} from '../stats.js';

// ─── Fixtures ────────────────────────────────────────────────────────
// Mirrors the server-side interfaces (not exported, but shape matches)

interface User { id: string; name: string; avatarColor: string }
interface Session { id: string; startDate: string; weeks: number }
interface Participation { userId: string; sessionId: string; startWeightKg: number; goalWeightKg: number }
interface WeighIn { userId: string; sessionId: string; weightKg: number; bodyFatPct?: number | null; weekIndex: number }

const session: Session = { id: 's1', startDate: '2026-04-20', weeks: 8 };

const users: User[] = [
  { id: 'u1', name: 'Alice', avatarColor: '#f00' },
  { id: 'u2', name: 'Bob', avatarColor: '#0f0' },
  { id: 'u3', name: 'Charlie', avatarColor: '#00f' },
];

const participations: Participation[] = [
  { userId: 'u1', sessionId: 's1', startWeightKg: 100, goalWeightKg: 85 },
  { userId: 'u2', sessionId: 's1', startWeightKg: 90, goalWeightKg: 80 },
  { userId: 'u3', sessionId: 's1', startWeightKg: 80, goalWeightKg: 70 },
];

const weighIns: WeighIn[] = [
  // Alice: steady loss 100→99→98→97
  { userId: 'u1', sessionId: 's1', weightKg: 100, weekIndex: 0 },
  { userId: 'u1', sessionId: 's1', weightKg: 99, weekIndex: 1 },
  { userId: 'u1', sessionId: 's1', weightKg: 98, weekIndex: 2 },
  { userId: 'u1', sessionId: 's1', weightKg: 97, weekIndex: 3 },
  // Bob: logged 0 and 2 only (gap at 1), bigger % loss
  { userId: 'u2', sessionId: 's1', weightKg: 90, weekIndex: 0 },
  { userId: 'u2', sessionId: 's1', weightKg: 87, weekIndex: 2 },
  // Charlie: 80→79→79.5 (gained in week 2)
  { userId: 'u3', sessionId: 's1', weightKg: 80, weekIndex: 0 },
  { userId: 'u3', sessionId: 's1', weightKg: 79, weekIndex: 1 },
  { userId: 'u3', sessionId: 's1', weightKg: 79.5, weekIndex: 2 },
];

// ─── computeLeaderboard ──────────────────────────────────────────────
// This exercises carryForwardWeights, weeklyPointsFor, longestLossStreak,
// and computeParticipantStats internally.

describe('computeLeaderboard', () => {
  it('multi-user sort by cumulativePct descending', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    expect(board).toHaveLength(3);

    // Verify descending sort
    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].cumulativePct).toBeGreaterThanOrEqual(board[i].cumulativePct);
    }
  });

  it('carry-forward: Bob gap at week 1 filled, stats still correct', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const bob = board.find((p) => p.userId === 'u2')!;

    // Bob: start=90, week0=90, week1=90(carry), week2=87, week3=87(carry)
    // cumulativePct = (90-87)/90 * 100 ≈ 3.33%
    expect(bob.cumulativePct).toBeCloseTo(3.33, 1);
    expect(bob.currentWeightKg).toBe(87);
    expect(bob.weeksLogged).toBe(2); // only 2 direct logs
  });

  it('percentage math with real numbers — floating point correctness', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const alice = board.find((p) => p.userId === 'u1')!;

    // Alice: (100-97)/100 * 100 = 3.0%
    expect(alice.cumulativePct).toBeCloseTo(3.0, 5);
    expect(alice.startWeightKg).toBe(100);
    expect(alice.currentWeightKg).toBe(97);
  });

  it('streak calculation — Alice has 3 consecutive losses', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const alice = board.find((p) => p.userId === 'u1')!;
    expect(alice.currentLossStreak).toBe(3);
  });

  it('streak calculation — Charlie gain at end breaks streak', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 2);
    const charlie = board.find((p) => p.userId === 'u3')!;
    expect(charlie.currentLossStreak).toBe(0);
  });

  it('missing user gracefully excluded — no crash on orphan participation', () => {
    const partialUsers = [users[0]]; // only Alice
    const board = computeLeaderboard(session, partialUsers, participations, weighIns, 3);
    expect(board).toHaveLength(1);
    expect(board[0].userId).toBe('u1');
  });
});

// ─── computeRanksForSession ──────────────────────────────────────────

describe('computeRanksForSession', () => {
  it('correct ordinal ranking from leaderboard', () => {
    const board = computeLeaderboard(session, users, participations, weighIns, 3);
    const ranks = computeRanksForSession(board);

    const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
    sorted.forEach((p, i) => {
      expect(ranks[p.userId]).toBe(i + 1);
    });
    expect(Object.keys(ranks)).toHaveLength(3);
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
    };
    expect(currentWeekIndex(sess, new Date())).toBe(2);
  });

  it('before session starts → clamped to 0', () => {
    const future: Session = { ...session, startDate: '2099-01-01' };
    expect(currentWeekIndex(future, new Date())).toBe(0);
  });

  it('beyond session end → clamped to weeks-1', () => {
    const past: Session = { ...session, startDate: '2020-01-01', weeks: 4 };
    expect(currentWeekIndex(past, new Date())).toBe(3);
  });
});
