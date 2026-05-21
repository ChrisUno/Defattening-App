import type {
  JournalEntry,
  Participation,
  ParticipantStats,
  Session,
  User,
  WeeklyPoint,
  WeighIn,
} from '../types';
import { differenceInCalendarWeeks, parseISO, addWeeks, format } from 'date-fns';

export const currentWeekIndex = (session: Session, now: Date = new Date()) => {
  const start = parseISO(session.startDate);
  const idx = differenceInCalendarWeeks(now, start);
  return Math.max(0, Math.min(session.weeks - 1, idx));
};

export const weekIndexForDate = (session: Session, when: Date) => {
  const start = parseISO(session.startDate);
  const idx = differenceInCalendarWeeks(when, start);
  return Math.max(0, Math.min(session.weeks - 1, idx));
};

export const latestBodyFatPct = (
  userId: string,
  sessionId: string,
  weighIns: WeighIn[],
): number | null => {
  const sorted = weighIns
    .filter((w) => w.userId === userId && w.sessionId === sessionId && w.bodyFatPct != null)
    .sort((a, b) => b.weekIndex - a.weekIndex);
  return sorted[0]?.bodyFatPct ?? null;
};

export const sessionWeekDate = (session: Session, weekIndex: number) => {
  return addWeeks(parseISO(session.startDate), weekIndex);
};

export const formatWeekLabel = (session: Session, weekIndex: number) => {
  return `Wk ${weekIndex + 1} · ${format(sessionWeekDate(session, weekIndex), 'MMM d')}`;
};

const weighInsForUserSession = (
  weighIns: WeighIn[],
  userId: string,
  sessionId: string,
) => weighIns.filter((w) => w.userId === userId && w.sessionId === sessionId);

export const carryForwardWeights = (
  participation: Participation,
  weighIns: WeighIn[],
  upToWeekInclusive: number,
): (number | null)[] => {
  const userWeighIns = weighInsForUserSession(
    weighIns,
    participation.userId,
    participation.sessionId,
  ).sort((a, b) => a.weekIndex - b.weekIndex);

  const result: (number | null)[] = [];
  let last: number = participation.startWeightKg ?? 0;
  for (let i = 0; i <= upToWeekInclusive; i += 1) {
    const direct = userWeighIns.find((w) => w.weekIndex === i);
    if (direct) {
      last = direct.weightKg;
      result.push(last);
    } else if (i === 0) {
      result.push(participation.startWeightKg ?? 0);
    } else {
      result.push(last);
    }
  }
  return result;
};

export const weeklyPointsFor = (
  participation: Participation,
  weighIns: WeighIn[],
  upToWeekInclusive: number,
): WeeklyPoint[] => {
  const weights = carryForwardWeights(participation, weighIns, upToWeekInclusive);
  const start = participation.startWeightKg ?? 0;
  return weights.map((weight, i) => {
    const prev = i === 0 ? start : weights[i - 1] ?? start;
    const w = weight ?? start;
    return {
      weekIndex: i,
      weightKg: w,
      pctFromStart: start ? ((start - w) / start) * 100 : 0,
      delta: prev ? ((prev - w) / prev) * 100 : 0,
    };
  });
};

const longestLossStreak = (points: WeeklyPoint[]): number => {
  let streak = 0;
  for (let i = points.length - 1; i >= 1; i -= 1) {
    if (points[i].weightKg < points[i - 1].weightKg) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

export const computeParticipantStats = (
  user: User,
  participation: Participation,
  weighIns: WeighIn[],
  weekIndex: number,
): ParticipantStats => {
  const points = weeklyPointsFor(participation, weighIns, weekIndex);
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];

  const cumulativePct = latest ? latest.pctFromStart : 0;
  const weeklyDelta = prior && latest ? ((prior.weightKg - latest.weightKg) / prior.weightKg) * 100 : 0;
  const bestWeekLoss = points.reduce(
    (acc, point, idx) => (idx === 0 ? acc : Math.max(acc, point.delta)),
    0,
  );

  const directLogs = weighInsForUserSession(weighIns, user.id, participation.sessionId);
  const distinctWeeksLogged = new Set(directLogs.map((w) => w.weekIndex)).size;

  return {
    userId: user.id,
    userName: user.name,
    avatarColor: user.avatarColor,
    cumulativePct,
    weeklyDelta,
    bestWeekLoss,
    currentLossStreak: longestLossStreak(points),
    currentWeightKg: latest?.weightKg ?? participation.startWeightKg ?? 0,
    startWeightKg: participation.startWeightKg,
    weeksLogged: distinctWeeksLogged,
  };
};

export const computeLeaderboard = (
  session: Session,
  users: User[],
  participations: Participation[],
  weighIns: WeighIn[],
  weekIndex: number,
): ParticipantStats[] => {
  const inSession = participations.filter((p) => p.sessionId === session.id);
  return inSession
    .map((p) => {
      const user = users.find((u) => u.id === p.userId);
      if (!user) return null;
      return computeParticipantStats(user, p, weighIns, weekIndex);
    })
    .filter((s): s is ParticipantStats => s !== null)
    .sort((a, b) => b.cumulativePct - a.cumulativePct);
};

export const findRival = (
  board: ParticipantStats[],
  userId: string,
): { rival: ParticipantStats; gap: number; userRank: number } | null => {
  const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
  const youIdx = sorted.findIndex((p) => p.userId === userId);
  if (youIdx === -1) return null;
  if (youIdx === 0) return null;
  const rival = sorted[youIdx - 1];
  const you = sorted[youIdx];
  return {
    rival,
    gap: rival.cumulativePct - you.cumulativePct,
    userRank: youIdx + 1,
  };
};

export const findPursuer = (
  board: ParticipantStats[],
  userId: string,
): { pursuer: ParticipantStats; gap: number; userRank: number; totalParticipants: number } | null => {
  const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
  const youIdx = sorted.findIndex((p) => p.userId === userId);
  if (youIdx === -1) return null;
  if (youIdx === sorted.length - 1) return null;
  const pursuer = sorted[youIdx + 1];
  const you = sorted[youIdx];
  return {
    pursuer,
    gap: you.cumulativePct - pursuer.cumulativePct,
    userRank: youIdx + 1,
    totalParticipants: sorted.length,
  };
};

export const computeRanksForSession = (
  board: ParticipantStats[],
): Record<string, number> => {
  const sorted = [...board].sort((a, b) => b.cumulativePct - a.cumulativePct);
  return Object.fromEntries(sorted.map((p, i) => [p.userId, i + 1]));
};

export const userHasWeighedInThisWeek = (
  userId: string,
  sessionId: string,
  weekIndex: number,
  weighIns: WeighIn[],
) => weighIns.some((w) => w.userId === userId && w.sessionId === sessionId && w.weekIndex === weekIndex);

export const userJournalForWeek = (
  userId: string,
  sessionId: string,
  weekIndex: number,
  journals: JournalEntry[],
) =>
  journals.find(
    (j) => j.userId === userId && j.sessionId === sessionId && j.weekIndex === weekIndex,
  );

export const formatKg = (kg: number | null | undefined) =>
  kg == null ? '—' : `${kg.toFixed(1)} kg`;

export const formatPct = (pct: number, decimals = 2) => {
  const abs = Math.abs(pct).toFixed(decimals);
  if (pct > 0) return `${abs}%`;
  if (pct < 0) return `−${abs}%`;
  return `0.${'0'.repeat(decimals)}%`;
};

export const formatSignedKg = (kg: number) => {
  const abs = Math.abs(kg).toFixed(1);
  if (kg > 0) return `−${abs} kg`;
  if (kg < 0) return `+${abs} kg`;
  return '0.0 kg';
};
