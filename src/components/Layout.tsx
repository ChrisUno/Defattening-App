import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, Trophy, Shield, UserCircle2, LogOut, Flame, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Avatar } from './ui/Avatar';
import { cn } from '../lib/cn';

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
];

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.currentUser);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  if (!user) return <>{children}</>;

  const isAdmin = user.role === 'admin';
  const links = isAdmin
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        { to: '/admin', label: 'Admin', icon: Shield },
        { to: '/profile', label: 'Profile', icon: UserCircle2 },
      ]
    : navLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b-2 border-ink-900/10 bg-cream-50/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 group"
            aria-label="Home"
          >
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-900 text-tangerine-300 ring-pop">
              <Flame size={20} className="group-hover:rotate-12 transition" />
            </span>
            <div className="hidden sm:block text-left leading-tight">
              <p className="font-display text-lg font-bold text-ink-900">Lose It Loud</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500 font-semibold">
                Workplace Weight Challenge
              </p>
            </div>
          </button>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-ink-900 text-cream-50'
                      : 'text-ink-700 hover:bg-ink-900/5',
                  )
                }
              >
                <Icon size={16} />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}

            <div className="ml-1 sm:ml-3 flex items-center gap-2 pl-1 sm:pl-3 border-l-2 border-ink-900/10">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle dark mode"
                aria-pressed={theme === 'dark'}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-700 hover:bg-ink-900/5 transition"
              >
                <Sun
                  size={16}
                  className={cn(
                    'absolute transition-all',
                    theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100',
                  )}
                />
                <Moon
                  size={16}
                  className={cn(
                    'absolute transition-all',
                    theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50',
                  )}
                />
              </button>
              <Avatar name={user.name} color={user.avatarColor} size="md" />
              <button
                onClick={handleSignOut}
                title="Sign out"
                aria-label="Sign out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
              >
                <LogOut size={16} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">{children}</main>

      <footer className="mt-12 border-t-2 border-ink-900/10 bg-cream-100/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-center text-xs text-ink-500">
          <p>© 2026 Unosquare · Generated with design.Unosquare</p>
        </div>
      </footer>
    </div>
  );
};
