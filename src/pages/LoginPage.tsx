import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Trophy, Crown, Sun, Moon, ChevronDown } from 'lucide-react';
import appIcon from '../assets/app-icon.png';
import { cn } from '../lib/cn';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';

const demoUsers = [
  { label: 'Sign in as Alex (User)', email: 'alex.morgan@unosquare.com', pw: 'password123' },
  { label: 'Sign in as Admin (Sam)', email: 'admin@unosquare.com', pw: 'admin123' },
];

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithEntra = useAuthStore((s) => s.signInWithEntra);
  const currentUser = useAuthStore((s) => s.currentUser);
  const hasActiveParticipation = useAuthStore((s) => s.hasActiveParticipation);
  const hydrate = useDataStore((s) => s.hydrate);
  const isHydrated = useDataStore((s) => s.isHydrated);
  const pushToast = useUiStore((s) => s.pushToast);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  useEffect(() => {
    if (currentUser && isHydrated) {
      navigate(hasActiveParticipation ? '/dashboard' : '/onboarding', { replace: true });
    }
  }, []);

  const [email, setEmail] = useState(import.meta.env.DEV ? 'alex.morgan@unosquare.com' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? 'password123' : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entraLoading, setEntraLoading] = useState(false);
  const [devExpanded, setDevExpanded] = useState(true);

  const navigateAfterLogin = () => {
    const { hasActiveParticipation, currentUser } = useAuthStore.getState();
    const isAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.role);
    navigate(hasActiveParticipation || isAdmin ? '/dashboard' : '/onboarding');
  };

  const handleEntraSignIn = async () => {
    setError('');
    setEntraLoading(true);
    try {
      await signInWithEntra();
      await hydrate();
      const { currentUser } = useAuthStore.getState();
      pushToast({
        title: `Welcome, ${currentUser?.name.split(' ')[0]}!`,
        description: 'Signed in with Microsoft.',
        variant: 'success',
      });
      navigateAfterLogin();
    } catch (err: any) {
      if (err?.errorCode === 'user_cancelled') return;
      setError(err.message || 'Microsoft sign-in failed.');
    } finally {
      setEntraLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      await hydrate();
      const { currentUser } = useAuthStore.getState();
      pushToast({
        title: `Welcome back, ${currentUser?.name.split(' ')[0]}!`,
        description: 'Time to make this week count.',
        variant: 'success',
      });
      navigateAfterLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const quickSignIn = async (sampleEmail: string, samplePw: string) => {
    setEmail(sampleEmail);
    setPassword(samplePw);
    setError('');
    setLoading(true);
    try {
      await signIn(sampleEmail, samplePw);
      await hydrate();
      const { currentUser } = useAuthStore.getState();
      pushToast({
        title: `Welcome back, ${currentUser?.name.split(' ')[0]}!`,
        description: 'Time to make this week count.',
        variant: 'success',
      });
      navigateAfterLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
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
            <img src={appIcon} alt="" className="h-4 w-4 rounded-full object-cover" />
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
              <img
                src={appIcon}
                alt="Lose It Loud"
                className="h-24 w-24 rounded-2xl object-cover"
              />
              <h2 className="mt-5 font-display text-3xl font-bold">Sign in</h2>
              <p className="mt-1 text-sm text-ink-500">
                Use your Unosquare Microsoft account
              </p>

              {error && (
                <div className="mt-4 rounded-xl border-2 border-rose-bright/40 bg-rose-bright/10 px-3 py-2 text-sm font-medium text-rose-bright">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleEntraSignIn}
                disabled={entraLoading || loading}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border-2 border-ink-900/15 bg-white px-5 py-3.5 text-sm font-semibold text-ink-900 shadow-sm hover:bg-ink-50 hover:border-ink-900/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {entraLoading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" />
                ) : (
                  <MicrosoftIcon />
                )}
                {entraLoading ? 'Signing in…' : 'Sign in with Microsoft'}
              </button>

              {import.meta.env.DEV && (
                <>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-ink-900/10" />
                    <span className="text-xs font-medium text-ink-400 uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-ink-900/10" />
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setDevExpanded(!devExpanded)}
                      className="flex items-center gap-2 text-xs font-bold text-ink-500 hover:text-ink-700 transition-colors uppercase tracking-wider"
                    >
                      <ChevronDown
                        size={14}
                        className={cn('transition-transform', devExpanded && 'rotate-180')}
                      />
                      Sign in with email (dev)
                    </button>

                    {devExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.2 }}
                      >
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

                          <Button type="submit" size="lg" className="w-full" rightIcon={<ArrowRight size={18} />} disabled={loading || entraLoading}>
                            {loading ? 'Signing in…' : "Let's go"}
                          </Button>
                        </form>

                        <div className="mt-5">
                          <p className="text-[11px] uppercase tracking-wider font-bold text-ink-500 mb-2">
                            Demo logins
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {demoUsers.map((d) => (
                              <button
                                key={d.email}
                                onClick={() => quickSignIn(d.email, d.pw)}
                                type="button"
                                className="rounded-xl border-2 border-ink-900/10 bg-cream-100 px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:border-tangerine-300 hover:bg-tangerine-50"
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-3 text-[11px] text-ink-500">
                            Password for users is <span className="font-mono font-bold">password123</span>, admin is{' '}
                            <span className="font-mono font-bold">admin123</span>.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
