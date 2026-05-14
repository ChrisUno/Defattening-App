import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, Sparkles, Trophy, Crown, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';

const demoUsers = [
  { label: 'Sign in as You (Alex)', email: 'you@unosquare.com' },
  { label: 'Sign in as Admin (Sam)', email: 'admin@unosquare.com' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const users = useDataStore((s) => s.users);
  const participations = useDataStore((s) => s.participations);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const pushToast = useUiStore((s) => s.pushToast);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const [email, setEmail] = useState('you@unosquare.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      setError('That combo doesn\'t look right. Try the demo logins below.');
      return;
    }
    signIn(user.id);
    pushToast({
      title: `Welcome back, ${user.name.split(' ')[0]}!`,
      description: 'Time to make this week count.',
      variant: 'success',
    });
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }
    const joined = participations.some(
      (p) => p.userId === user.id && p.sessionId === activeSessionId,
    );
    navigate(joined ? '/dashboard' : '/onboarding');
  };

  const quickSignIn = (sampleEmail: string) => {
    setEmail(sampleEmail);
    setPassword(sampleEmail.startsWith('admin') ? 'admin' : 'password');
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16 flex items-center justify-center relative">
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle dark mode"
        aria-pressed={theme === 'dark'}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-ink-900/10 bg-cream-50 text-ink-700 hover:bg-ink-900/5 transition shadow-[0_2px_0_0_rgba(11,23,51,0.06)]"
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
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="order-2 md:order-1"
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink-900/10 bg-cream-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-700">
            <Flame size={14} className="text-tangerine-500" />
            Workplace Challenge Edition
          </div>

          <h1 className="mt-5 font-display text-5xl md:text-6xl font-bold leading-[0.95] text-ink-900 text-balance">
            Brag about the <span className="text-tangerine-500">percentage.</span>{' '}
            Keep the <span className="italic">kilos</span> to yourself.
          </h1>

          <p className="mt-5 text-lg text-ink-700 max-w-md">
            A friendly little weight-loss face-off for your team. Track weekly progress,
            crown the queen of cardio, and never show the actual number on the scale.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { icon: Sparkles, text: 'Private weight, public percentages' },
              { icon: Trophy, text: 'Weekly leaderboards with streaks, deltas & best-week trophies' },
              { icon: Crown, text: 'End of season? Someone gets crowned A Complete Loser.' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-ink-700">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-tangerine-100 text-tangerine-700">
                  <Icon size={14} />
                </span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="order-1 md:order-2"
        >
          <div className="rounded-[32px] border-2 border-ink-900/10 bg-cream-50 p-7 sm:p-9 shadow-[0_10px_0_0_rgba(27,20,16,0.04)] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-tangerine-100" aria-hidden />
            <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-grape-50" aria-hidden />

            <div className="relative">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-tangerine-300">
                <Flame size={22} />
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold">Sign in</h2>
              <p className="mt-1 text-sm text-ink-500">
                Email + password for now · MSAL / Azure coming soon
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@unosquare.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl border-2 border-rose-bright/40 bg-rose-bright/10 px-3 py-2 text-sm font-medium text-rose-bright">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" rightIcon={<ArrowRight size={18} />}>
                  Let&apos;s go
                </Button>
              </form>

              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-wider font-bold text-ink-500 mb-2">
                  Demo logins
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoUsers.map((d) => (
                    <button
                      key={d.email}
                      onClick={() => quickSignIn(d.email)}
                      type="button"
                      className="rounded-xl border-2 border-ink-900/10 bg-cream-100 px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:border-tangerine-300 hover:bg-tangerine-50"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-ink-500">
                  Password for users is <span className="font-mono font-bold">password</span>, admin is{' '}
                  <span className="font-mono font-bold">admin</span>.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
