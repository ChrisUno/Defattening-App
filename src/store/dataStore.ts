import { create } from 'zustand';
import { buildInitialData } from '../lib/mockData';
import {
  computeLeaderboard,
  computeRanksForSession,
  currentWeekIndex,
} from './../lib/stats';
import type {
  ActivityEntry,
  JournalEntry,
  Participation,
  Session,
  User,
  WeighIn,
} from '../types';

interface DataState {
  users: User[];
  sessions: Session[];
  participations: Participation[];
  weighIns: WeighIn[];
  journals: JournalEntry[];
  activityFeed: ActivityEntry[];
  activeSessionId: string;

  setActiveSession: (sessionId: string) => void;

  addUser: (input: Omit<User, 'id' | 'createdAt' | 'avatarColor'> & { avatarColor?: string }) => User;
  updateUser: (userId: string, patch: Partial<User>) => void;
  removeUser: (userId: string) => void;

  joinSession: (input: Omit<Participation, 'id' | 'joinedAt'>) => Participation;
  updateParticipation: (id: string, patch: Partial<Participation>) => void;

  recordWeighIn: (input: Omit<WeighIn, 'id' | 'recordedAt' | 'measuredAt'> & { measuredAt?: string }) => {
    weighIn: WeighIn;
    overtakes: ActivityEntry[];
  };
  saveJournal: (input: Omit<JournalEntry, 'id' | 'createdAt'>) => JournalEntry;

  createSession: (input: Omit<Session, 'id' | 'status' | 'createdBy'> & {
    status?: Session['status'];
    createdBy: string;
  }) => Session;
  updateSession: (id: string, patch: Partial<Session>) => void;
  removeSession: (id: string) => void;
}

const seed = buildInitialData();

let counter = 0;
const uid = (prefix: string) => {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
};

export const useDataStore = create<DataState>((set) => ({
  ...seed,
  activeSessionId: 'session-spring-2026',

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  addUser: (input) => {
    const newUser: User = {
      id: uid('user'),
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
      avatarColor: input.avatarColor ?? '#2563EB',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  updateUser: (userId, patch) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    })),

  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      participations: state.participations.filter((p) => p.userId !== userId),
      weighIns: state.weighIns.filter((w) => w.userId !== userId),
      journals: state.journals.filter((j) => j.userId !== userId),
    })),

  joinSession: (input) => {
    const part: Participation = {
      ...input,
      id: uid('part'),
      joinedAt: new Date().toISOString(),
    };
    set((state) => {
      const existing = state.participations.find(
        (p) => p.userId === input.userId && p.sessionId === input.sessionId,
      );
      if (existing) {
        return {
          participations: state.participations.map((p) =>
            p.id === existing.id ? { ...p, ...input } : p,
          ),
        };
      }
      return { participations: [...state.participations, part] };
    });
    return part;
  },

  updateParticipation: (id, patch) =>
    set((state) => ({
      participations: state.participations.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  recordWeighIn: (input) => {
    const now = new Date().toISOString();
    const entry: WeighIn = {
      id: uid('weighin'),
      userId: input.userId,
      sessionId: input.sessionId,
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct,
      weekIndex: input.weekIndex,
      measuredAt: input.measuredAt ?? now,
      recordedAt: now,
    };

    let overtakes: ActivityEntry[] = [];

    set((state) => {
      const session = state.sessions.find((s) => s.id === input.sessionId);
      const ranksBefore = session
        ? computeRanksForSession(
            computeLeaderboard(
              session,
              state.users,
              state.participations,
              state.weighIns,
              currentWeekIndex(session),
            ),
          )
        : {};

      const existing = state.weighIns.find(
        (w) =>
          w.userId === input.userId &&
          w.sessionId === input.sessionId &&
          w.weekIndex === input.weekIndex,
      );

      const nextWeighIns = existing
        ? state.weighIns.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  weightKg: input.weightKg,
                  bodyFatPct: input.bodyFatPct,
                  measuredAt: entry.measuredAt,
                  recordedAt: entry.recordedAt,
                }
              : w,
          )
        : [...state.weighIns, entry];

      let nextActivity = state.activityFeed;

      if (session) {
        const boardAfter = computeLeaderboard(
          session,
          state.users,
          state.participations,
          nextWeighIns,
          currentWeekIndex(session),
        );
        const ranksAfter = computeRanksForSession(boardAfter);

        const detected: ActivityEntry[] = [];
        for (const actor of boardAfter) {
          const prev = ranksBefore[actor.userId];
          const next = ranksAfter[actor.userId];
          if (prev == null || next == null) continue;
          if (next < prev) {
            for (const target of boardAfter) {
              if (target.userId === actor.userId) continue;
              const tPrev = ranksBefore[target.userId];
              const tNext = ranksAfter[target.userId];
              if (tPrev == null || tNext == null) continue;
              if (tPrev < prev && tNext > next) {
                detected.push({
                  id: uid('activity'),
                  type: 'overtake',
                  occurredAt: now,
                  sessionId: input.sessionId,
                  actorUserId: actor.userId,
                  targetUserId: target.userId,
                  actorPct: actor.cumulativePct,
                  targetPct: target.cumulativePct,
                });
              }
            }
          }
        }

        overtakes = detected;
        if (detected.length > 0) {
          nextActivity = [...detected, ...state.activityFeed].slice(0, 40);
        }
      }

      return {
        weighIns: nextWeighIns,
        activityFeed: nextActivity,
      };
    });

    return { weighIn: entry, overtakes };
  },

  saveJournal: (input) => {
    const entry: JournalEntry = {
      ...input,
      id: uid('journal'),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const existing = state.journals.find(
        (j) =>
          j.userId === input.userId &&
          j.sessionId === input.sessionId &&
          j.weekIndex === input.weekIndex,
      );
      if (existing) {
        return {
          journals: state.journals.map((j) =>
            j.id === existing.id ? { ...j, content: input.content, createdAt: entry.createdAt } : j,
          ),
        };
      }
      return { journals: [...state.journals, entry] };
    });
    return entry;
  },

  createSession: (input) => {
    const session: Session = {
      id: uid('session'),
      name: input.name,
      description: input.description,
      weeks: input.weeks,
      weighInDayOfWeek: input.weighInDayOfWeek,
      weighInNote: input.weighInNote,
      startDate: input.startDate,
      status: input.status ?? 'upcoming',
      createdBy: input.createdBy,
    };
    set((state) => ({ sessions: [...state.sessions, session] }));
    return session;
  },

  updateSession: (id, patch) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      participations: state.participations.filter((p) => p.sessionId !== id),
      weighIns: state.weighIns.filter((w) => w.sessionId !== id),
      journals: state.journals.filter((j) => j.sessionId !== id),
    })),
}));
