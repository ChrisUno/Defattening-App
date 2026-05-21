import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Activity,
  Target,
  CalendarClock,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Ruler,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input, Label } from './ui/Input';
import {
  buildBmiBreakdown,
  bmiScalePosition,
  categoryLabel,
  type BmiCategory,
  averageWeeklyLossKg,
  projectToHealthyBmi,
} from '../lib/bmi';
import type { Participation, User, WeighIn } from '../types';
import { parseISO } from 'date-fns';
import { useDataStore } from '../store/dataStore';
import { cn } from '../lib/cn';

interface BmiDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  currentWeightKg: number;
  participation: Participation;
  weighIns: WeighIn[];
  weekIndex: number;
  sessionStartDate: string;
}

const segments: { label: string; range: string; category: BmiCategory; toneBg: string; barColor: string }[] = [
  {
    label: 'Under',
    range: '<18.5',
    category: 'underweight',
    toneBg: 'bg-tangerine-100',
    barColor: 'bg-tangerine-500',
  },
  {
    label: 'Healthy',
    range: '18.5–24.9',
    category: 'healthy',
    toneBg: 'bg-lime-300/40',
    barColor: 'bg-lime-500',
  },
  {
    label: 'Over',
    range: '25–29.9',
    category: 'overweight',
    toneBg: 'bg-tangerine-100',
    barColor: 'bg-tangerine-500',
  },
  {
    label: 'Obese',
    range: '30+',
    category: 'obese',
    toneBg: 'bg-rose-bright/15',
    barColor: 'bg-rose-bright',
  },
];

export const BmiDialog = ({
  open,
  onClose,
  user,
  currentWeightKg,
  participation,
  weighIns,
  weekIndex,
  sessionStartDate,
}: BmiDialogProps) => {
  const updateUser = useDataStore((s) => s.updateUser);
  const [heightInput, setHeightInput] = useState(user.heightCm?.toString() ?? '');
  const [heightError, setHeightError] = useState('');

  useEffect(() => {
    if (open) {
      setHeightInput(user.heightCm?.toString() ?? '');
      setHeightError('');
    }
  }, [open, user.heightCm]);

  const saveHeight = (e: React.FormEvent) => {
    e.preventDefault();
    const cm = Number(heightInput);
    if (!cm || cm < 100 || cm > 230) {
      setHeightError('Height should be between 100 and 230 cm.');
      return;
    }
    updateUser(user.id, { heightCm: Math.round(cm) });
  };

  if (!user.heightCm) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        title={
          <span className="inline-flex items-center gap-2">
            <Ruler className="text-tangerine-500" size={22} />
            We need your height first
          </span>
        }
        description="BMI compares your weight against your height — without it the math falls apart."
      >
        <form onSubmit={saveHeight} className="space-y-4">
          <div>
            <Label>Your height</Label>
            <Input
              type="number"
              inputMode="numeric"
              min="100"
              max="230"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              suffix="cm"
              placeholder="172"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-ink-500">
              You can also edit this any time on your{' '}
              <Link to="/profile" className="font-semibold text-tangerine-500 hover:text-tangerine-600 underline">
                profile
              </Link>
              .
            </p>
          </div>
          {heightError && (
            <p className="text-sm text-rose-bright font-medium">{heightError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={<Sparkles size={14} />}>
              Save & calculate BMI
            </Button>
          </div>
        </form>
      </Dialog>
    );
  }

  const breakdown = buildBmiBreakdown(currentWeightKg, user.heightCm);
  const startBreakdown = buildBmiBreakdown(participation.startWeightKg ?? 0, user.heightCm);
  const goalBreakdown = buildBmiBreakdown(participation.goalWeightKg ?? 0, user.heightCm);
  const weeklyLoss = averageWeeklyLossKg(participation, weighIns, weekIndex);
  const projection = projectToHealthyBmi(
    breakdown,
    weeklyLoss,
    parseISO(sessionStartDate),
    weekIndex,
  );

  const position = bmiScalePosition(breakdown.bmi);

  const categoryTone: Record<BmiCategory, { bg: string; text: string; badge: 'tangerine' | 'lime' | 'rose' }> = {
    underweight: { bg: 'bg-tangerine-50', text: 'text-tangerine-700', badge: 'tangerine' },
    healthy: { bg: 'bg-lime-300/30', text: 'text-lime-600', badge: 'lime' },
    overweight: { bg: 'bg-tangerine-50', text: 'text-tangerine-700', badge: 'tangerine' },
    obese: { bg: 'bg-rose-bright/10', text: 'text-rose-bright', badge: 'rose' },
  };

  const headlineByCategory: Record<BmiCategory, string> = {
    underweight: "You're a touch under the healthy range — gentle progress upward.",
    healthy: "You're right in the healthy BMI zone. Keep doing what you're doing.",
    overweight: 'A bit above the healthy range. Steady wins this — no crash dieting.',
    obese: "There's distance to cover, but you've already started. Big picture: small steps, steady.",
  };

  const tone = categoryTone[breakdown.category];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      title={
        <span className="inline-flex items-center gap-2">
          <Activity className="text-tangerine-500" size={22} />
          Your BMI & path to a healthy range
        </span>
      }
      description="Body Mass Index from your latest weight and your profile height. Private — only visible to you."
    >
      <div className="space-y-5">
        <div className={cn('rounded-2xl border-2 border-ink-900/10 p-5', tone.bg)}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <Badge tone={tone.badge} className="mb-1.5">
                {categoryLabel(breakdown.category)}
              </Badge>
              <p className="font-display text-5xl font-bold tabular-nums leading-none">
                {breakdown.bmi.toFixed(1)}
              </p>
              <p className={cn('text-sm font-semibold mt-2 max-w-md', tone.text)}>
                {headlineByCategory[breakdown.category]}
              </p>
            </div>
            <div className="text-sm text-ink-700 sm:text-right space-y-0.5">
              <p>
                <span className="text-ink-500">Current weight</span>{' '}
                <span className="font-bold tabular-nums">{currentWeightKg.toFixed(1)} kg</span>
              </p>
              <p>
                <span className="text-ink-500">Height</span>{' '}
                <span className="font-bold tabular-nums">{user.heightCm} cm</span>
              </p>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="flex h-2.5 rounded-full overflow-hidden">
              {segments.map((seg) => (
                <div key={seg.category} className={cn('flex-1', seg.barColor, 'opacity-50')} />
              ))}
            </div>
            <div
              className="absolute -top-1.5 -translate-x-1/2"
              style={{ left: `${position}%` }}
              aria-hidden
            >
              <div className="h-5 w-5 rounded-full border-4 border-cream-50 bg-ink-900 shadow-md" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider font-bold text-ink-500">
              {segments.map((seg) => (
                <span key={seg.category} className="flex flex-col items-start gap-0">
                  <span>{seg.label}</span>
                  <span className="font-mono text-ink-300 normal-case tracking-normal">{seg.range}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <StatBlock
            icon={<Target size={14} />}
            label="Healthy zone"
            value={`${breakdown.healthyMinKg}–${breakdown.healthyMaxKg} kg`}
            sub="BMI 18.5 to 24.9"
          />
          <StatBlock
            icon={breakdown.direction === 'hold' ? <CheckCircle2 size={14} /> : breakdown.direction === 'lose' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            label={breakdown.direction === 'hold' ? 'Status' : breakdown.direction === 'lose' ? 'Distance to healthy' : 'Distance to healthy'}
            value={
              breakdown.direction === 'hold'
                ? 'You\'re there'
                : `${Math.abs(breakdown.kgFromTarget).toFixed(1)} kg to ${breakdown.direction}`
            }
            sub={`Target: ${breakdown.targetKg.toFixed(1)} kg`}
          />
          <StatBlock
            icon={<CalendarClock size={14} />}
            label="At your pace"
            value={
              projection.weeksToTarget === 0
                ? 'Maintain'
                : projection.weeksToTarget
                  ? `~${projection.weeksToTarget} ${projection.weeksToTarget === 1 ? 'week' : 'weeks'}`
                  : '—'
            }
            sub={
              projection.weeklyRateKg == null
                ? 'Log a few more weeks for a forecast'
                : projection.rateIsHelpful
                  ? `${projection.weeklyRateKg > 0 ? '−' : '+'}${Math.abs(projection.weeklyRateKg).toFixed(2)} kg/wk average`
                  : `Trend is going the other way`
            }
          />
        </div>

        <div className="rounded-2xl border-2 border-ink-900/10 bg-cream-50 p-5">
          <h4 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles size={16} className="text-tangerine-500" />
            Your path to a healthy BMI
          </h4>
          <p className="text-sm text-ink-700 mt-1">
            {breakdown.direction === 'hold' && (
              <>You&apos;re already in the healthy BMI zone. The play now is maintenance — keep logging weekly to spot drift early.</>
            )}
            {breakdown.direction === 'lose' && projection.rateIsHelpful && projection.weeksToTarget != null && projection.estimatedDate && (
              <>
                Aim for{' '}
                <span className="font-bold text-ink-900 tabular-nums">{breakdown.targetKg.toFixed(1)} kg</span>{' '}
                — the upper edge of the healthy range. At your current{' '}
                <span className="font-bold text-ink-900 tabular-nums">
                  {projection.weeklyRateKg!.toFixed(2)} kg/week
                </span>{' '}
                loss rate, that&apos;s about{' '}
                <span className="font-bold text-ink-900">
                  {projection.weeksToTarget} {projection.weeksToTarget === 1 ? 'week' : 'weeks'}
                </span>
                {' '}— roughly{' '}
                <span className="font-bold text-ink-900">
                  {format(projection.estimatedDate, 'MMM d, yyyy')}
                </span>
                .
              </>
            )}
            {breakdown.direction === 'lose' && !projection.rateIsHelpful && (
              <>
                You&apos;re{' '}
                <span className="font-bold text-ink-900 tabular-nums">{Math.abs(breakdown.kgFromTarget).toFixed(1)} kg</span>{' '}
                away from a healthy BMI of{' '}
                <span className="font-bold text-ink-900 tabular-nums">{breakdown.targetKg.toFixed(1)} kg</span>.
                {' '}
                {projection.weeklyRateKg == null
                  ? 'We\'ll project a finish date once you\'ve logged a couple of weeks of data.'
                  : 'Your trend is going the other direction right now — flip one habit this week and the math turns in your favor.'}
              </>
            )}
            {breakdown.direction === 'gain' && (
              <>
                You&apos;re a little under the healthy range. The target is{' '}
                <span className="font-bold text-ink-900 tabular-nums">{breakdown.targetKg.toFixed(1)} kg</span>{' '}
                — about{' '}
                <span className="font-bold text-ink-900 tabular-nums">{Math.abs(breakdown.kgFromTarget).toFixed(1)} kg</span>{' '}
                of healthy weight to add. Strength training + a calorie surplus is the friendlier route.
              </>
            )}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <PathTick
              label="Started at"
              kg={participation.startWeightKg ?? 0}
              bmi={startBreakdown.bmi}
            />
            <PathTick
              label="You are here"
              kg={currentWeightKg}
              bmi={breakdown.bmi}
              highlight
            />
            <PathTick
              label="Your goal"
              kg={participation.goalWeightKg ?? 0}
              bmi={goalBreakdown.bmi}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-900"
          >
            Update height <ArrowRight size={12} />
          </Link>
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </Dialog>
  );
};

interface StatBlockProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}

const StatBlock = ({ icon, label, value, sub }: StatBlockProps) => (
  <div className="rounded-2xl border-2 border-ink-900/10 bg-cream-50 px-4 py-3">
    <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500 inline-flex items-center gap-1">
      <span className="text-tangerine-500">{icon}</span>
      {label}
    </p>
    <p className="font-display text-lg font-bold mt-1 tabular-nums leading-tight">{value}</p>
    <p className="text-xs text-ink-500 font-medium mt-0.5">{sub}</p>
  </div>
);

interface PathTickProps {
  label: string;
  kg: number;
  bmi: number;
  highlight?: boolean;
}

const PathTick = ({ label, kg, bmi, highlight }: PathTickProps) => (
  <div
    className={cn(
      'rounded-xl border-2 px-3 py-2',
      highlight
        ? 'border-tangerine-500 bg-tangerine-50'
        : 'border-ink-900/10 bg-cream-50',
    )}
  >
    <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">{label}</p>
    <p className="font-display text-base font-bold tabular-nums mt-0.5">
      {kg.toFixed(1)} kg
    </p>
    <p className="text-[11px] text-ink-500 font-semibold">BMI {bmi.toFixed(1)}</p>
  </div>
);
