import { create } from 'zustand';
import { api } from '../lib/api';
import { useAuthStore } from './authStore';
import type {
  ActivityEntry,
  JournalEntry,
  Participation,
  Session,
  User,
  WeighIn,
} from '../types';

export interface WeighInStatus {
  sessionId: string;
  weekIndex: number;
  hasWeighedIn: boolean;
  weighInDayOfWeek: number;
}

interface DataState {
  users: User[];
  sessions: Session[];
  participations: Participation[];
  weighIns: WeighIn[];
  journals: JournalEntry[];
  activityFeed: ActivityEntry[];
  weighInStatuses: WeighInStatus[];
  activeSessionId: string;
  isHydrated: boolean;

  setActiveSession: (sessionId: string) => void;

  hydrate: (activeSessionId?: string) => Promise<void>;
  hydrateSessionData: (sessionId: string) => Promise<void>;

  addUser: (input: { name: string; email: string; password?: string; role?: string }) => Promise<User>;
  updateUser: (userId: string, patch: Partial<User>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  changeUserRole: (userId: string, role: 'admin' | 'user') => Promise<User>;

  joinSession: (input: { sessionId: string; startWeightKg: number; goalWeightKg: number }) => Promise<Participation>;
  adminJoinSession: (input: { userId: string; sessionId: string; startWeightKg: number; goalWeightKg: number }) => Promise<Participation>;
  removeParticipation: (id: string) => Promise<void>;
  updateParticipation: (id: string, patch: Partial<Participation>) => Promise<void>;

  recordWeighIn: (input: {
    sessionId: string; weightKg: number; bodyFatPct?: number;
    weekIndex: number; measuredAt?: string;
  }) => Promise<{ weighIn: WeighIn; overtakes: ActivityEntry[] }>;

  saveJournal: (input: { sessionId: string; weekIndex: number; content: string }) => Promise<JournalEntry>;

  createSession: (input: Omit<Session, 'id' | 'status' | 'createdBy'> & { status?: string }) => Promise<Session>;
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

let hydrateInFlight: Promise<void> | null = null;

export const useDataStore = create<DataState>((set, get) => ({
  users: [],
  sessions: [],
  participations: [],
  weighIns: [],
  journals: [],
  activityFeed: [],
  weighInStatuses: [],
  activeSessionId: '',
  isHydrated: false,

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId });
    get().hydrateSessionData(sessionId);
  },

  hydrate: async (sessionId?) => {
    if (hydrateInFlight) return hydrateInFlight;

    hydrateInFlight = (async () => {
      try {
        const [users, sessions, participations] = await Promise.all([
          api.get<User[]>('/api/users'),
          api.get<Session[]>('/api/sessions'),
          api.get<Participation[]>('/api/participations'),
        ]);

        const active = sessionId
          || sessions.find((s) => s.status === 'active')?.id
          || sessions[0]?.id
          || '';

        let weighIns: WeighIn[] = [];
        let journals: JournalEntry[] = [];
        let activityFeed: ActivityEntry[] = [];

        if (active) {
          [weighIns, journals, activityFeed] = await Promise.all([
            api.get<WeighIn[]>(`/api/weigh-ins?sessionId=${active}`),
            api.get<JournalEntry[]>(`/api/journals?sessionId=${active}`),
            api.get<ActivityEntry[]>(`/api/activity?sessionId=${active}`),
          ]);
        }

        let weighInStatuses: WeighInStatus[] = [];
        try {
          weighInStatuses = await api.get<WeighInStatus[]>('/api/weigh-ins/status');
        } catch { /* non-critical */ }

        set({ users, sessions, participations, weighIns, journals, activityFeed, weighInStatuses, activeSessionId: active, isHydrated: true });
      } finally {
        hydrateInFlight = null;
      }
    })();

    return hydrateInFlight;
  },

  hydrateSessionData: async (sessionId) => {
    if (!sessionId) return;
    const [weighIns, journals, activityFeed] = await Promise.all([
      api.get<WeighIn[]>(`/api/weigh-ins?sessionId=${sessionId}`),
      api.get<JournalEntry[]>(`/api/journals?sessionId=${sessionId}`),
      api.get<ActivityEntry[]>(`/api/activity?sessionId=${sessionId}`),
    ]);
    set({ weighIns, journals, activityFeed });
  },

  addUser: async (input) => {
    const newUser = await api.post<User>('/api/users', input);
    set((s) => ({ users: [...s.users, newUser] }));
    return newUser;
  },

  updateUser: async (userId, patch) => {
    const updated = await api.patch<User>(`/api/users/${userId}`, patch);
    set((s) => ({
      users: s.users.map((u) => (u.id === userId ? { ...u, ...updated } : u)),
    }));
    const { currentUser } = useAuthStore.getState();
    if (currentUser && currentUser.id === userId) {
      useAuthStore.getState().updateCurrentUser(updated);
    }
  },

  removeUser: async (userId) => {
    await api.delete(`/api/users/${userId}`);
    set((s) => ({
      users: s.users.filter((u) => u.id !== userId),
      participations: s.participations.filter((p) => p.userId !== userId),
      weighIns: s.weighIns.filter((w) => w.userId !== userId),
      journals: s.journals.filter((j) => j.userId !== userId),
    }));
  },

  changeUserRole: async (userId, role) => {
    const updated = await api.patch<User>(`/api/users/${userId}/role`, { role });
    set((s) => ({
      users: s.users.map((u) => (u.id === userId ? updated : u)),
    }));
    return updated;
  },

  joinSession: async (input) => {
    const part = await api.post<Participation>('/api/participations', input);
    set((s) => {
      const existing = s.participations.find(
        (p) => p.userId === part.userId && p.sessionId === part.sessionId,
      );
      if (existing) {
        return {
          participations: s.participations.map((p) => (p.id === existing.id ? part : p)),
        };
      }
      return { participations: [...s.participations, part] };
    });
    return part;
  },

  adminJoinSession: async (input) => {
    const part = await api.post<Participation>('/api/participations/admin', input);
    set((s) => {
      const existing = s.participations.find(
        (p) => p.userId === part.userId && p.sessionId === part.sessionId,
      );
      if (existing) {
        return {
          participations: s.participations.map((p) => (p.id === existing.id ? part : p)),
        };
      }
      return { participations: [...s.participations, part] };
    });
    return part;
  },

  removeParticipation: async (id) => {
    await api.delete(`/api/participations/${id}`);
    const part = get().participations.find((p) => p.id === id);
    set((s) => ({
      participations: s.participations.filter((p) => p.id !== id),
      weighIns: part ? s.weighIns.filter((w) => !(w.userId === part.userId && w.sessionId === part.sessionId)) : s.weighIns,
      journals: part ? s.journals.filter((j) => !(j.userId === part.userId && j.sessionId === part.sessionId)) : s.journals,
    }));
  },

  updateParticipation: async (id, patch) => {
    const updated = await api.patch<Participation>(`/api/participations/${id}`, patch);
    set((s) => ({
      participations: s.participations.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  },

  recordWeighIn: async (input) => {
    const result = await api.post<{ weighIn: WeighIn; overtakes: ActivityEntry[] }>('/api/weigh-ins', input);

    set((s) => {
      const existing = s.weighIns.find(
        (w) => w.userId === result.weighIn.userId && w.sessionId === result.weighIn.sessionId && w.weekIndex === result.weighIn.weekIndex,
      );
      const nextWeighIns = existing
        ? s.weighIns.map((w) => (w.id === existing.id ? result.weighIn : w))
        : [...s.weighIns, result.weighIn];

      let nextActivity = s.activityFeed;
      if (result.overtakes.length > 0) {
        nextActivity = [...result.overtakes, ...s.activityFeed].slice(0, 40);
      }

      const nextStatuses = s.weighInStatuses.map((st) =>
        st.sessionId === result.weighIn.sessionId && st.weekIndex === result.weighIn.weekIndex
          ? { ...st, hasWeighedIn: true }
          : st,
      );

      return { weighIns: nextWeighIns, activityFeed: nextActivity, weighInStatuses: nextStatuses };
    });

    return result;
  },

  saveJournal: async (input) => {
    const entry = await api.post<JournalEntry>('/api/journals', input);
    set((s) => {
      const existing = s.journals.find(
        (j) => j.userId === entry.userId && j.sessionId === entry.sessionId && j.weekIndex === entry.weekIndex,
      );
      if (existing) {
        return {
          journals: s.journals.map((j) => (j.id === existing.id ? entry : j)),
        };
      }
      return { journals: [...s.journals, entry] };
    });
    return entry;
  },

  createSession: async (input) => {
    const session = await api.post<Session>('/api/sessions', input);
    set((s) => ({ sessions: [...s.sessions, session] }));
    return session;
  },

  updateSession: async (id, patch) => {
    const updated = await api.patch<Session>(`/api/sessions/${id}`, patch);
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...updated } : sess)),
    }));
  },

  removeSession: async (id) => {
    await api.delete(`/api/sessions/${id}`);
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
      participations: s.participations.filter((p) => p.sessionId !== id),
      weighIns: s.weighIns.filter((w) => w.sessionId !== id),
      journals: s.journals.filter((j) => j.sessionId !== id),
    }));
  },
}));
