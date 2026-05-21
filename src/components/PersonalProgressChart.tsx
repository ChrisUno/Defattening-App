import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import type { Participation, WeighIn } from '../types';
import { weeklyPointsFor } from '../lib/stats';
import { useChartTokens } from '../lib/chartTheme';

interface PersonalProgressChartProps {
  participation: Participation;
  weighIns: WeighIn[];
  weekIndex: number;
  totalWeeks: number;
}

export const PersonalProgressChart = ({
  participation,
  weighIns,
  weekIndex,
  totalWeeks,
}: PersonalProgressChartProps) => {
  const tokens = useChartTokens();

  const data = useMemo(() => {
    const points = weeklyPointsFor(participation, weighIns, weekIndex);
    return points.map((p) => ({
      label: `Wk ${p.weekIndex + 1}`,
      weight: +p.weightKg.toFixed(1),
      pct: +p.pctFromStart.toFixed(2),
    }));
  }, [participation, weighIns, weekIndex]);

  const projected = useMemo(() => {
    const allWeeks: { label: string; weight?: number; goal: number }[] = [];
    for (let i = 0; i < totalWeeks; i += 1) {
      const existing = data[i];
      allWeeks.push({
        label: `Wk ${i + 1}`,
        weight: existing?.weight,
        goal: participation.goalWeightKg ?? 0,
      });
    }
    return allWeeks;
  }, [data, totalWeeks, participation.goalWeightKg]);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={projected} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.primary} stopOpacity={0.55} />
              <stop offset="100%" stopColor={tokens.primary} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={tokens.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            stroke={tokens.axisLabel}
            tick={{ fontSize: 11, fontWeight: 600, fill: tokens.axisLabel }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v}kg`}
            tickLine={false}
            axisLine={false}
            stroke={tokens.axisLabel}
            tick={{ fontSize: 11, fontWeight: 600, fill: tokens.axisLabel }}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: tokens.border, strokeWidth: 1 }}
            contentStyle={{
              background: tokens.surface,
              border: `2px solid ${tokens.border}`,
              borderRadius: 16,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: tokens.textPrimary,
            }}
            formatter={(value, name) => {
              if (name === 'weight') return [`${value} kg`, 'Weight'];
              if (name === 'goal') return [`${value} kg`, 'Goal'];
              return [value, name];
            }}
          />
          <ReferenceLine
            y={participation.startWeightKg ?? 0}
            stroke={tokens.secondary}
            strokeDasharray="3 3"
            label={{
              value: `Start ${(participation.startWeightKg ?? 0).toFixed(1)}kg`,
              fill: tokens.secondary,
              fontSize: 10,
              fontWeight: 700,
              position: 'insideTopRight',
            }}
          />
          <ReferenceLine
            y={participation.goalWeightKg ?? 0}
            stroke={tokens.success}
            strokeDasharray="3 3"
            label={{
              value: `Goal ${(participation.goalWeightKg ?? 0).toFixed(1)}kg`,
              fill: tokens.successDark,
              fontSize: 10,
              fontWeight: 700,
              position: 'insideBottomRight',
            }}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke={tokens.primary}
            strokeWidth={3}
            fill="url(#weightGradient)"
            dot={{ r: 4, fill: tokens.primary, stroke: tokens.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: tokens.primary, stroke: tokens.surface, strokeWidth: 3 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
