import { useEffect, useMemo, useState } from 'react';
import { Scale, NotebookPen, Sparkles, CalendarDays, Percent } from 'lucide-react';
import { format, parseISO, addWeeks, isAfter, isBefore } from 'date-fns';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input, Label, Textarea } from './ui/Input';
import { Badge } from './ui/Badge';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';
import { useCurrentUser } from '../store/authStore';
import {
  currentWeekIndex,
  userJournalForWeek,
  weeklyPointsFor,
  weekIndexForDate,
} from '../lib/stats';

interface WeighInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (kind: 'weighin' | 'first') => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export const WeighInModal = ({ open, onClose, onSuccess }: WeighInModalProps) => {
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const journals = useDataStore((s) => s.journals);
  const weighIns = useDataStore((s) => s.weighIns);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const recordWeighIn = useDataStore((s) => s.recordWeighIn);
  const saveJournal = useDataStore((s) => s.saveJournal);
  const pushToast = useUiStore((s) => s.pushToast);
  const user = useCurrentUser(users);

  const session = sessions.find((s) => s.id === activeSessionId);
  const participation = participations.find(
    (p) => p.userId === user?.id && p.sessionId === activeSessionId,
  );

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [measuredOn, setMeasuredOn] = useState(today());
  const [journal, setJournal] = useState('');
  const [error, setError] = useState('');

  const derivedWeekIdx = useMemo(() => {
    if (!session) return 0;
    return weekIndexForDate(session, parseISO(measuredOn));
  }, [session, measuredOn]);

  const existingForWeek = useMemo(() => {
    if (!user || !session) return null;
    return weighIns.find(
      (w) => w.userId === user.id && w.sessionId === session.id && w.weekIndex === derivedWeekIdx,
    );
  }, [user, session, weighIns, derivedWeekIdx]);

  useEffect(() => {
    if (!open || !user || !session || !participation) return;
    const initialWeekIdx = currentWeekIndex(session);
    const existingThisWeek = weighIns.find(
      (w) =>
        w.userId === user.id &&
        w.sessionId === session.id &&
        w.weekIndex === initialWeekIdx,
    );

    if (existingThisWeek) {
      setWeight(existingThisWeek.weightKg.toFixed(1));
      setBodyFat(
        existingThisWeek.bodyFatPct != null
          ? existingThisWeek.bodyFatPct.toFixed(1)
          : '',
      );
      setMeasuredOn(format(parseISO(existingThisWeek.measuredAt), 'yyyy-MM-dd'));
    } else {
      const points = weeklyPointsFor(participation, weighIns, Math.max(initialWeekIdx - 1, 0));
      const latest = points[points.length - 1];
      setWeight(latest ? latest.weightKg.toFixed(1) : participation.startWeightKg.toFixed(1));
      const lastBf = [...weighIns]
        .filter((w) => w.userId === user.id && w.sessionId === session.id && w.bodyFatPct != null)
        .sort((a, b) => b.weekIndex - a.weekIndex)[0];
      setBodyFat(lastBf?.bodyFatPct != null ? lastBf.bodyFatPct.toFixed(1) : '');
      setMeasuredOn(today());
    }
    setJournal(
      userJournalForWeek(user.id, session.id, initialWeekIdx, journals)?.content ?? '',
    );
    setError('');
  }, [open, user?.id, session?.id, participation?.id]);

  if (!user || !session || !participation) return null;

  const sessionStart = parseISO(session.startDate);
  const sessionEnd = addWeeks(sessionStart, session.weeks);
  const minDate = format(sessionStart, 'yyyy-MM-dd');
  const maxDate = today();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = Number(weight);
    if (!kg || kg < 30 || kg > 300) {
      setError('Please enter a weight between 30 and 300 kg.');
      return;
    }
    const measuredDate = parseISO(measuredOn);
    if (isBefore(measuredDate, sessionStart)) {
      setError('Measurement date is before this session started.');
      return;
    }
    if (isAfter(measuredDate, new Date())) {
      setError("Can't log a weigh-in for the future. Time travel coming soon.");
      return;
    }
    if (isAfter(measuredDate, sessionEnd)) {
      setError('Measurement date is after this session ended.');
      return;
    }

    let bf: number | undefined;
    if (bodyFat.trim()) {
      const parsed = Number(bodyFat);
      if (!parsed || parsed < 3 || parsed > 70) {
        setError('Body fat % should be between 3 and 70 (or leave it blank).');
        return;
      }
      bf = +parsed.toFixed(1);
    }

    const result = recordWeighIn({
      userId: user.id,
      sessionId: session.id,
      weightKg: +kg.toFixed(1),
      bodyFatPct: bf,
      weekIndex: derivedWeekIdx,
      measuredAt: parseISO(measuredOn).toISOString(),
    });

    if (journal.trim()) {
      saveJournal({
        userId: user.id,
        sessionId: session.id,
        weekIndex: derivedWeekIdx,
        content: journal.trim(),
      });
    }

    const priorPoints = weeklyPointsFor(participation, weighIns, Math.max(derivedWeekIdx - 1, 0));
    const lastKg = priorPoints[priorPoints.length - 1]?.weightKg ?? participation.startWeightKg;
    const lost = lastKg - kg;
    pushToast({
      title:
        lost > 0
          ? `Down ${lost.toFixed(1)} kg this week!`
          : lost < 0
            ? `Up ${Math.abs(lost).toFixed(1)} kg — next week is yours.`
            : 'Held steady this week.',
      description: `Logged for week ${derivedWeekIdx + 1}. The leaderboard just got a refresh.`,
      variant: lost > 0 ? 'celebrate' : 'default',
    });

    const usersMap = new Map(users.map((u) => [u.id, u]));
    for (const evt of result.overtakes) {
      const actor = usersMap.get(evt.actorUserId);
      const target = usersMap.get(evt.targetUserId);
      if (!actor || !target) continue;
      if (evt.actorUserId === user.id) {
        pushToast({
          title: `You just passed ${target.name.split(' ')[0]}!`,
          description: 'Recognition unlocked. Don\'t look back.',
          variant: 'celebrate',
        });
      } else if (evt.targetUserId === user.id) {
        pushToast({
          title: `${actor.name.split(' ')[0]} just overtook you`,
          description: 'They\'re right above you now — time to respond.',
          variant: 'warning',
        });
      }
    }

    onSuccess?.(weighIns.length === 0 ? 'first' : 'weighin');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      title={
        <span className="inline-flex items-center gap-2">
          <Scale className="text-tangerine-500" size={24} />
          Weigh-in
        </span>
      }
      description={
        <span>
          {session.weighInNote}
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight">Current weight</Label>
            <Input
              id="weight"
              inputMode="decimal"
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              suffix="kg"
              placeholder="77.4"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Strictly kilograms · Only you and the Admin see this number.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="bodyfat" className="mb-0">
                <Percent size={11} className="inline -mt-0.5 mr-1" />
                Body fat
              </Label>
              <Badge tone="cream">Optional</Badge>
            </div>
            <Input
              id="bodyfat"
              inputMode="decimal"
              type="number"
              step="0.1"
              min="3"
              max="70"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              suffix="%"
              placeholder="24.5"
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Skip if your scale doesn&apos;t measure it.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="measured">
            <CalendarDays size={11} className="inline -mt-0.5 mr-1" />
            Date measured
          </Label>
          <Input
            id="measured"
            type="date"
            min={minDate}
            max={maxDate}
            value={measuredOn}
            onChange={(e) => setMeasuredOn(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-ink-500">
            Falls into{' '}
            <span className="font-bold text-ink-700">
              Week {derivedWeekIdx + 1} of {session.weeks}
            </span>
            {existingForWeek
              ? ' · this will replace your existing logged value for that week.'
              : '.'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="mb-0">
              <NotebookPen size={12} className="inline -mt-0.5 mr-1" />
              Journal (private)
            </Label>
            <Badge tone="grape">Just for you</Badge>
          </div>
          <Textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            rows={4}
            placeholder="How did the week go? Any wins, losses, or pizza-related setbacks?"
          />
        </div>

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
          <Button type="submit" size="lg" leftIcon={<Sparkles size={16} />}>
            {existingForWeek ? 'Update log' : 'Log it'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
