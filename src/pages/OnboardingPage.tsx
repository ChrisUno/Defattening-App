import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { CalendarDays, Target, Scale, Sparkles, ArrowRight, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const sessions = useDataStore((s) => s.sessions);
  const joinSession = useDataStore((s) => s.joinSession);
  const setActiveSession = useDataStore((s) => s.setActiveSession);
  const user = useAuthStore((s) => s.currentUser);
  const setHasActiveParticipation = useAuthStore((s) => s.setHasActiveParticipation);
  const pushToast = useUiStore((s) => s.pushToast);
  const signOut = useAuthStore((s) => s.signOut);

  const participations = useDataStore((s) => s.participations);

  const joinableSessions = useMemo(
    () => sessions.filter((s) => s.status !== 'completed'),
    [sessions],
  );

  const alreadyJoined = useMemo(
    () => joinableSessions.some((s) =>
      participations.some((p) => p.userId === user?.id && p.sessionId === s.id)
    ),
    [joinableSessions, participations, user],
  );

  useEffect(() => {
    if (alreadyJoined) {
      setHasActiveParticipation(true);
      navigate('/dashboard', { replace: true });
    }
  }, [alreadyJoined, navigate, setHasActiveParticipation]);

  const defaultSession = joinableSessions.find((s) => s.status === 'active') ?? joinableSessions[0];
  const [selectedSession, setSelectedSession] = useState<string>(defaultSession?.id ?? '');
  const [startWeight, setStartWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/');
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const sw = Number(startWeight);
    const gw = Number(goalWeight);
    if (!selectedSession || !sw || !gw) {
      setError('Pick a session and enter both weights to continue.');
      return;
    }
    if (sw < 30 || sw > 300) {
      setError('Start weight should be between 30 and 300 kg.');
      return;
    }
    if (gw <= 0 || gw >= sw) {
      setError('Goal weight should be lower than your start weight.');
      return;
    }

    setLoading(true);
    try {
      await joinSession({
        sessionId: selectedSession,
        startWeightKg: sw,
        goalWeightKg: gw,
      });
      setActiveSession(selectedSession);
      setHasActiveParticipation(true);
      pushToast({
        title: 'You\'re in! Let the (good kind of) games begin.',
        description: 'We\'ll see you on the leaderboard.',
        variant: 'celebrate',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to join session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Badge tone="tangerine" className="mb-4">
            <Sparkles size={12} /> Welcome, {user.name.split(' ')[0]}
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-ink-900 text-balance">
            Three quick things, and you&apos;re on the board.
          </h1>
          <p className="mt-3 text-ink-700 max-w-xl">
            Your weight stays private — only you (and the Admin) ever see the actual number.
            The team only sees your percentage.
          </p>
        </motion.div>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-grape-50 text-grape-700">
                <Users size={18} />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold">Pick a session</h2>
                <p className="text-sm text-ink-500">Only active or upcoming sessions are joinable.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {joinableSessions.map((s) => {
                const active = selectedSession === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSession(s.id)}
                    className={
                      'text-left rounded-2xl border-2 p-4 transition ' +
                      (active
                        ? 'border-tangerine-500 bg-tangerine-50 shadow-[0_4px_0_0_var(--color-tangerine-300)]'
                        : 'border-ink-900/10 bg-cream-50 hover:border-ink-900/30')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg font-bold">{s.name}</p>
                      <Badge tone={s.status === 'active' ? 'lime' : 'grape'}>{s.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">{s.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-ink-700">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <CalendarDays size={12} /> {s.weeks} weeks
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Starts {format(parseISO(s.startDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card tone="sunny">
              <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50 text-tangerine-700">
                  <Scale size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Starting weight</h2>
                  <p className="text-sm text-ink-700">Locked in for the whole session.</p>
                </div>
              </div>
              <Label htmlFor="start">Today&apos;s weight</Label>
              <Input
                id="start"
                inputMode="decimal"
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={startWeight}
                onChange={(e) => setStartWeight(e.target.value)}
                suffix="kg"
                placeholder="78.5"
              />
            </Card>

            <Card tone="grape">
              <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50 text-grape-700">
                  <Target size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Goal weight</h2>
                  <p className="text-sm text-ink-700">Aim ambitious, but kind to yourself.</p>
                </div>
              </div>
              <Label htmlFor="goal">Where you&apos;re headed</Label>
              <Input
                id="goal"
                inputMode="decimal"
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                suffix="kg"
                placeholder="72.0"
              />
            </Card>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-rose-bright/40 bg-rose-bright/10 px-4 py-3 text-sm font-medium text-rose-bright">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-semibold text-ink-500 hover:text-ink-900 self-start"
            >
              ← Sign out
            </button>
            <Button type="submit" size="lg" rightIcon={<ArrowRight size={18} />} disabled={loading}>
              {loading ? 'Joining…' : 'Join the challenge'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
