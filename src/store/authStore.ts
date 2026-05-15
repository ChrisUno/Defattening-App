import { create } from 'zustand';
import { api } from '../lib/api';
import type { User } from '../types';

interface AuthResponse {
  user: User;
  hasActiveParticipation: boolean;
}

interface AuthState {
  currentUser: User | null;
  hasActiveParticipation: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;

  checkSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setHasActiveParticipation: (val: boolean) => void;
  updateCurrentUser: (patch: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  hasActiveParticipation: false,
  isLoading: true,
  isAuthenticated: false,

  checkSession: async () => {
    try {
      const data = await api.get<AuthResponse>('/api/auth/me');
      set({
        currentUser: data.user,
        hasActiveParticipation: data.hasActiveParticipation,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        currentUser: null,
        hasActiveParticipation: false,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  signIn: async (email, password) => {
    const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
    set({
      currentUser: data.user,
      hasActiveParticipation: data.hasActiveParticipation,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  signOut: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // best-effort
    }
    set({
      currentUser: null,
      hasActiveParticipation: false,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setHasActiveParticipation: (val) => set({ hasActiveParticipation: val }),

  updateCurrentUser: (patch) => set((s) => ({
    currentUser: s.currentUser ? { ...s.currentUser, ...patch } : null,
  })),
}));
