import { create } from 'zustand';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'celebrate' | 'warning';
}

type Theme = 'light' | 'dark';

const THEME_KEY = 'lose-it-loud:theme';

const readInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeClass = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

interface UiState {
  toasts: Toast[];
  seenBanners: Record<string, boolean>;
  theme: Theme;
  globalLoading: boolean;
  globalError: string | null;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  markBannerSeen: (key: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setGlobalLoading: (loading: boolean) => void;
  setGlobalError: (message: string | null) => void;
}

let counter = 0;
const uid = () => {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
};

const initialTheme = readInitialTheme();
applyThemeClass(initialTheme);

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  seenBanners: {},
  theme: initialTheme,
  globalLoading: false,
  globalError: null,
  pushToast: (toast) =>
    set((s) => ({ toasts: [...s.toasts, { ...toast, id: uid() }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markBannerSeen: (key) => set((s) => ({ seenBanners: { ...s.seenBanners, [key]: true } })),
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(THEME_KEY, next);
    applyThemeClass(next);
    set({ theme: next });
  },
  setTheme: (theme) => {
    window.localStorage.setItem(THEME_KEY, theme);
    applyThemeClass(theme);
    set({ theme });
  },
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  setGlobalError: (message) => set({ globalError: message }),
}));
