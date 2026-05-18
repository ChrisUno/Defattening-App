import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Scale, Target, ArrowRight, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Badge } from './ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';
import { cn } from '../lib/cn';

interface JoinSessionDialogProps {
  open: boolean;
  onClose: () => void;
}

export const JoinSessionDialog = ({ open, onClose }: JoinSessionDialogProps) => {
  const user = useAuthStore((s) => s.currentUser);
  const setHasActiveParticipation = useAuthStore((s) => s.setHasActiveParticipation);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const joinSession = useDataStore((s) => s.joinSession);
  const setActiveSession = useDataStore((s) => s.setActiveSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const [selectedSession, setSelectedSession] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const joinableSessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.status !== 'completed' &&
          !participations.some((p) => p.userId === user?.id && p.sessionId === s.id),
      ),
    [sessions, participations, user],
  );

  const participantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of joinableSessions) {
      counts[s.id] = participations.filter((p) => p.sessionId === s.id).length;
    }
    return counts;
  }, [joinableSessions, participations]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSession(joinableSessions[0]?.id ?? '');
      setStartWeight('');
      setGoalWeight('');
      setError('');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sw = Number(startWeight);
    const gw = Number(goalWeight);

    if (!selectedSession) {
      setError('Pick a session to join.');
      return;
    }
    if (!sw || sw < 30 || sw > 300) {
      setError('Start weight should be between 30 and 300 kg.');
      return;
    }
    if (!gw || gw <= 0 || gw >= sw) {
      setError('Goal weight should be lower than your start weight.');
      return;
    }

    setLoading(true);
    try {
      await joinSession({
        sessionId: selectedSession,
        startWeightKg: +sw.toFixed(1),
        goalWeightKg: +gw.toFixed(1),
      });
      setActiveSession(selectedSession);
      setHasActiveParticipation(true);

      const sessionName = sessions.find((s) => s.id === selectedSession)?.name ?? 'the session';
      pushToast({
        title: `Joined ${sessionName}!`,
        description: 'Your dashboard has been switched to the new session.',
        variant: 'celebrate',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join session.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      title="Join another session"
      description="Pick a session and set your starting weights to hop in."
    >
      <form onSubmit={submit} className="space-y-5">
        {joinableSessions.length === 0 ? (
          <p className="text-sm text-ink-500 py-4 text-center">
            No joinable sessions available right now.
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              {joinableSessions.map((s) => {
                const active = selectedSession === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSession(s.id)}
                    className={cn(
                      'text-left rounded-2xl border-2 p-4 transition',
                      active
                        ? 'border-tangerine-500 bg-tangerine-50 shadow-[0_4px_0_0_var(--color-tangerine-300)]'
                        : 'border-ink-900/10 bg-cream-50 hover:border-ink-900/30',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-base font-bold">{s.name}</p>
                      <Badge tone={s.status === 'active' ? 'lime' : 'grape'}>{s.status}</Badge>
                    </div>
                    {s.description && (
                      <p className="mt-1 text-sm text-ink-500 line-clamp-2">{s.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-ink-700">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <CalendarDays size={12} /> {s.weeks} weeks
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Starts {format(parseISO(s.startDate), 'MMM d, yyyy')}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Users size={12} /> {participantCounts[s.id] ?? 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="join-start">
                  <Scale size={11} className="inline -mt-0.5 mr-1" />
                  Starting weight
                </Label>
                <Input
                  id="join-start"
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
              </div>
              <div>
                <Label htmlFor="join-goal">
                  <Target size={11} className="inline -mt-0.5 mr-1" />
                  Goal weight
                </Label>
                <Input
                  id="join-goal"
                  inputMode="decimal"
                  type="number"
                  step="0.1"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  suffix="kg"
                  placeholder="72.0"
                />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="rounded-xl border-2 border-rose-bright/40 bg-rose-bright/10 px-3 py-2 text-sm font-medium text-rose-bright">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-ink-500 hover:text-ink-900"
          >
            Cancel
          </button>
          {joinableSessions.length > 0 && (
            <Button type="submit" size="lg" rightIcon={<ArrowRight size={16} />} disabled={loading}>
              {loading ? 'Joining…' : 'Join session'}
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  );
};
