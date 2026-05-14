import type { Participation, WeighIn } from '../types';
import { weeklyPointsFor } from './stats';

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese';

export interface BmiBreakdown {
  bmi: number;
  category: BmiCategory;
  healthyMinKg: number;
  healthyMaxKg: number;
  midHealthyKg: number;
  targetKg: number;
  kgFromTarget: number;
  direction: 'lose' | 'gain' | 'hold';
}

const HEALTHY_BMI_MIN = 18.5;
const HEALTHY_BMI_MAX = 24.9;
const HEALTHY_BMI_MID = 22;

export const calculateBmi = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return weightKg / (heightM * heightM);
};

export const categoryForBmi = (bmi: number): BmiCategory => {
  if (bmi < HEALTHY_BMI_MIN) return 'underweight';
  if (bmi <= HEALTHY_BMI_MAX) return 'healthy';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

export const categoryLabel = (c: BmiCategory): string =>
  ({
    underweight: 'Underweight',
    healthy: 'Healthy range',
    overweight: 'Overweight',
    obese: 'Obese',
  })[c];

export const buildBmiBreakdown = (
  weightKg: number,
  heightCm: number,
): BmiBreakdown => {
  const heightM = heightCm / 100;
  const bmi = calculateBmi(weightKg, heightCm);
  const category = categoryForBmi(bmi);
  const healthyMinKg = +(HEALTHY_BMI_MIN * heightM * heightM).toFixed(1);
  const healthyMaxKg = +(HEALTHY_BMI_MAX * heightM * heightM).toFixed(1);
  const midHealthyKg = +(HEALTHY_BMI_MID * heightM * heightM).toFixed(1);

  let targetKg: number;
  let direction: 'lose' | 'gain' | 'hold';
  if (category === 'underweight') {
    targetKg = healthyMinKg;
    direction = 'gain';
  } else if (category === 'healthy') {
    targetKg = weightKg;
    direction = 'hold';
  } else {
    targetKg = healthyMaxKg;
    direction = 'lose';
  }

  const kgFromTarget = +(weightKg - targetKg).toFixed(1);

  return {
    bmi: +bmi.toFixed(1),
    category,
    healthyMinKg,
    healthyMaxKg,
    midHealthyKg,
    targetKg,
    kgFromTarget,
    direction,
  };
};

export const averageWeeklyLossKg = (
  participation: Participation,
  weighIns: WeighIn[],
  weekIdx: number,
): number | null => {
  const points = weeklyPointsFor(participation, weighIns, weekIdx);
  if (points.length < 2) return null;
  const directLogs = weighIns.filter(
    (w) => w.userId === participation.userId && w.sessionId === participation.sessionId,
  );
  if (directLogs.length < 2) return null;
  const first = points[0].weightKg;
  const last = points[points.length - 1].weightKg;
  const weeksElapsed = points.length - 1;
  return (first - last) / weeksElapsed;
};

export interface BmiProjection {
  weeksToTarget: number | null;
  estimatedDate: Date | null;
  weeklyRateKg: number | null;
  rateIsHelpful: boolean;
}

export const projectToHealthyBmi = (
  breakdown: BmiBreakdown,
  weeklyLossKg: number | null,
  sessionStart: Date,
  currentWeekIndex: number,
): BmiProjection => {
  if (breakdown.direction === 'hold' || breakdown.kgFromTarget === 0) {
    return { weeksToTarget: 0, estimatedDate: null, weeklyRateKg: weeklyLossKg, rateIsHelpful: true };
  }

  if (weeklyLossKg == null) {
    return { weeksToTarget: null, estimatedDate: null, weeklyRateKg: null, rateIsHelpful: false };
  }

  const needsLoss = breakdown.direction === 'lose';
  const rateMatches = needsLoss ? weeklyLossKg > 0 : weeklyLossKg < 0;

  if (!rateMatches || weeklyLossKg === 0) {
    return {
      weeksToTarget: null,
      estimatedDate: null,
      weeklyRateKg: weeklyLossKg,
      rateIsHelpful: false,
    };
  }

  const weeksToTarget = Math.ceil(Math.abs(breakdown.kgFromTarget) / Math.abs(weeklyLossKg));
  const totalWeeksFromStart = currentWeekIndex + weeksToTarget;
  const estimatedDate = new Date(sessionStart);
  estimatedDate.setDate(estimatedDate.getDate() + totalWeeksFromStart * 7);

  return {
    weeksToTarget,
    estimatedDate,
    weeklyRateKg: weeklyLossKg,
    rateIsHelpful: true,
  };
};

export const bmiScalePosition = (bmi: number, min = 15, max = 40): number => {
  const clamped = Math.min(max, Math.max(min, bmi));
  return ((clamped - min) / (max - min)) * 100;
};
