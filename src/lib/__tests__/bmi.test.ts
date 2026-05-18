import { describe, it, expect } from 'vitest';
import {
  calculateBmi,
  categoryForBmi,
  buildBmiBreakdown,
  averageWeeklyLossKg,
  projectToHealthyBmi,
  bmiScalePosition,
  type BmiBreakdown,
} from '../bmi';
import type { Participation, WeighIn } from '../../types';

// ─── helpers ─────────────────────────────────────────────────────────

const mkParticipation = (overrides: Partial<Participation> = {}): Participation => ({
  id: 'part-1',
  userId: 'u1',
  sessionId: 's1',
  startWeightKg: 100,
  goalWeightKg: 85,
  joinedAt: '2026-01-06',
  ...overrides,
});

const mkWeighIn = (weekIndex: number, weightKg: number, overrides: Partial<WeighIn> = {}): WeighIn => ({
  id: `wi-${weekIndex}`,
  userId: 'u1',
  sessionId: 's1',
  weightKg,
  weekIndex,
  measuredAt: '2026-01-06',
  recordedAt: '2026-01-06',
  ...overrides,
});

// ─── calculateBmi ────────────────────────────────────────────────────

describe('calculateBmi', () => {
  it('computes BMI for 70 kg / 175 cm → ~22.9', () => {
    // BMI = 70 / (1.75)^2 = 70 / 3.0625 ≈ 22.857
    expect(calculateBmi(70, 175)).toBeCloseTo(22.86, 1);
  });

  it('returns 0 for zero height', () => {
    expect(calculateBmi(80, 0)).toBe(0);
  });

  it('returns 0 for negative height', () => {
    expect(calculateBmi(80, -10)).toBe(0);
  });
});

// ─── categoryForBmi ──────────────────────────────────────────────────

describe('categoryForBmi', () => {
  it('18.4 → underweight (just below 18.5 threshold)', () => {
    expect(categoryForBmi(18.4)).toBe('underweight');
  });

  it('18.5 → healthy (exact lower boundary)', () => {
    expect(categoryForBmi(18.5)).toBe('healthy');
  });

  it('24.9 → healthy (exact upper boundary)', () => {
    expect(categoryForBmi(24.9)).toBe('healthy');
  });

  it('25.0 → overweight (just above healthy max)', () => {
    expect(categoryForBmi(25.0)).toBe('overweight');
  });

  it('29.9 → overweight (just below obese threshold)', () => {
    expect(categoryForBmi(29.9)).toBe('overweight');
  });

  it('30.0 → obese (exact obese boundary)', () => {
    expect(categoryForBmi(30.0)).toBe('obese');
  });
});

// ─── buildBmiBreakdown ───────────────────────────────────────────────

describe('buildBmiBreakdown', () => {
  it('underweight → direction=gain, target=healthyMin', () => {
    // 50 kg, 175 cm → BMI ≈ 16.3 (underweight)
    const bd = buildBmiBreakdown(50, 175);
    expect(bd.category).toBe('underweight');
    expect(bd.direction).toBe('gain');
    expect(bd.targetKg).toBe(bd.healthyMinKg);
    expect(bd.kgFromTarget).toBeLessThan(0); // needs to gain
  });

  it('healthy → direction=hold, target=currentWeight', () => {
    // 70 kg, 175 cm → BMI ≈ 22.9
    const bd = buildBmiBreakdown(70, 175);
    expect(bd.category).toBe('healthy');
    expect(bd.direction).toBe('hold');
    expect(bd.targetKg).toBe(70);
    expect(bd.kgFromTarget).toBe(0);
  });

  it('overweight → direction=lose, target=healthyMax', () => {
    // 85 kg, 175 cm → BMI ≈ 27.8
    const bd = buildBmiBreakdown(85, 175);
    expect(bd.category).toBe('overweight');
    expect(bd.direction).toBe('lose');
    expect(bd.targetKg).toBe(bd.healthyMaxKg);
    expect(bd.kgFromTarget).toBeGreaterThan(0); // needs to lose
  });

  it('obese → direction=lose, target=healthyMax', () => {
    // 110 kg, 175 cm → BMI ≈ 35.9
    const bd = buildBmiBreakdown(110, 175);
    expect(bd.category).toBe('obese');
    expect(bd.direction).toBe('lose');
    expect(bd.targetKg).toBe(bd.healthyMaxKg);
  });
});

// ─── averageWeeklyLossKg ─────────────────────────────────────────────

describe('averageWeeklyLossKg', () => {
  it('3 weeks of steady loss → correct average', () => {
    const part = mkParticipation({ startWeightKg: 100 });
    const weighIns = [
      mkWeighIn(0, 100),
      mkWeighIn(1, 99),
      mkWeighIn(2, 98),
      mkWeighIn(3, 97),
    ];
    // (100 - 97) / 3 = 1.0 kg/week
    const rate = averageWeeklyLossKg(part, weighIns, 3);
    expect(rate).toBeCloseTo(1.0, 5);
  });

  it('fewer than 2 weekly points → null', () => {
    const part = mkParticipation({ startWeightKg: 100 });
    const weighIns = [mkWeighIn(0, 100)];
    expect(averageWeeklyLossKg(part, weighIns, 0)).toBeNull();
  });

  it('fewer than 2 direct logs → null', () => {
    // upToWeekInclusive=2 creates 3 points via carry-forward,
    // but only 1 actual weigh-in exists
    const part = mkParticipation({ startWeightKg: 100 });
    const weighIns = [mkWeighIn(0, 100)];
    expect(averageWeeklyLossKg(part, weighIns, 2)).toBeNull();
  });
});

// ─── projectToHealthyBmi ─────────────────────────────────────────────

describe('projectToHealthyBmi', () => {
  const sessionStart = new Date('2026-01-06');

  it('already healthy → weeksToTarget=0', () => {
    const bd = buildBmiBreakdown(70, 175); // healthy
    const result = projectToHealthyBmi(bd, 0.5, sessionStart, 2);
    expect(result.weeksToTarget).toBe(0);
    expect(result.rateIsHelpful).toBe(true);
  });

  it('overweight, losing 0.5 kg/wk → correct weeks + estimated date', () => {
    const bd = buildBmiBreakdown(85, 175); // overweight
    // kgFromTarget = 85 - healthyMaxKg. healthyMax = 24.9 * 1.75^2 = 76.2
    // kgFromTarget ≈ 8.8; weeks = ceil(8.8 / 0.5) = 18
    const result = projectToHealthyBmi(bd, 0.5, sessionStart, 4);
    expect(result.weeksToTarget).toBeGreaterThan(0);
    expect(result.rateIsHelpful).toBe(true);
    expect(result.estimatedDate).toBeInstanceOf(Date);
    // estimated date = sessionStart + (4 + weeksToTarget) * 7 days
    const expectedDate = new Date(sessionStart);
    expectedDate.setDate(expectedDate.getDate() + (4 + result.weeksToTarget!) * 7);
    expect(result.estimatedDate!.getTime()).toBe(expectedDate.getTime());
  });

  it('null weekly rate → rateIsHelpful=false', () => {
    const bd = buildBmiBreakdown(85, 175);
    const result = projectToHealthyBmi(bd, null, sessionStart, 4);
    expect(result.rateIsHelpful).toBe(false);
    expect(result.weeksToTarget).toBeNull();
  });

  it('wrong direction (gaining when needs to lose) → rateIsHelpful=false', () => {
    const bd = buildBmiBreakdown(85, 175); // needs to lose
    // negative weeklyLossKg means gaining weight
    const result = projectToHealthyBmi(bd, -0.5, sessionStart, 4);
    expect(result.rateIsHelpful).toBe(false);
  });

  it('underweight, gaining weight → correct positive projection', () => {
    const bd = buildBmiBreakdown(50, 175); // underweight, direction=gain
    // weeklyLossKg < 0 means gaining weight → matches "gain" direction
    const result = projectToHealthyBmi(bd, -0.5, sessionStart, 2);
    expect(result.rateIsHelpful).toBe(true);
    expect(result.weeksToTarget).toBeGreaterThan(0);
  });
});

// ─── bmiScalePosition ────────────────────────────────────────────────

describe('bmiScalePosition', () => {
  it('clamps below min → 0', () => {
    expect(bmiScalePosition(10, 15, 40)).toBe(0);
  });

  it('clamps above max → 100', () => {
    expect(bmiScalePosition(50, 15, 40)).toBe(100);
  });

  it('midpoint value → ~50', () => {
    // mid of 15–40 = 27.5 → ((27.5 - 15) / 25) * 100 = 50
    expect(bmiScalePosition(27.5, 15, 40)).toBe(50);
  });
});
