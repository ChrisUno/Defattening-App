import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  currentUserId: string | null;
  signIn: (userId: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUserId: null,
  signIn: (userId) => set({ currentUserId: userId }),
  signOut: () => set({ currentUserId: null }),
}));

export const useCurrentUser = (users: User[]): User | null => {
  const id = useAuthStore((s) => s.currentUserId);
  return users.find((u) => u.id === id) ?? null;
};
