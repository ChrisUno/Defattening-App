import { describe, it, expect } from 'vitest';
import {
  getWeightComparison,
  getSessionWeightComparison,
  getWeeksToGoal,
} from '../weightComparisons';

// ─── getWeightComparison (personal table) ────────────────────────────

describe('getWeightComparison', () => {
  it('1.0 kg → bag of sugar (exact match)', () => {
    const result = getWeightComparison(1.0);
    expect(result.label).toBe('a bag of sugar');
    expect(result.emoji).toBe('🍬');
  });

  it('0.1 kg → stick of butter (closest, below range)', () => {
    const result = getWeightComparison(0.1);
    // 0.1 is closest to 0.2 (stick of butter) — diff 0.1 vs 0.3 for loaf of bread
    expect(result.label).toBe('a stick of butter');
  });

  it('25 kg → gold bar (closest, above max 20)', () => {
    const result = getWeightComparison(25);
    // 25 is closest to 20 (gold bar) — diff 5 vs 10 for microwave (15)
    expect(result.label).toBe('a gold bar');
  });

  it('1.7 kg → pineapple (1.5) not rack of ribs (2.0) — closer wins', () => {
    const result = getWeightComparison(1.7);
    // |1.7 - 1.5| = 0.2 vs |1.7 - 2.0| = 0.3
    expect(result.label).toBe('a pineapple');
  });
});

// ─── getSessionWeightComparison (session table) ──────────────────────

describe('getSessionWeightComparison', () => {
  it('10 kg → car tire (exact match)', () => {
    const result = getSessionWeightComparison(10);
    expect(result.label).toBe('a car tire');
    expect(result.emoji).toBe('🛞');
  });

  it('600 kg → grand piano (closest above max 500)', () => {
    const result = getSessionWeightComparison(600);
    // 600 is closest to 500 (grand piano) — diff 100 vs 200 for vending machine (300)
    expect(result.label).toBe('a grand piano');
  });
});

// ─── getWeeksToGoal ──────────────────────────────────────────────────

describe('getWeeksToGoal', () => {
  it('90kg current, 80kg goal, 5kg lost in 5 weeks → 10 weeks', () => {
    // avgLoss = 5/5 = 1 kg/wk; remaining = 90-80 = 10; ceil(10/1) = 10
    expect(getWeeksToGoal(90, 80, 5, 5)).toBe(10);
  });

  it('already at goal → 0', () => {
    expect(getWeeksToGoal(80, 80, 5, 5)).toBe(0);
  });

  it('below goal → 0', () => {
    expect(getWeeksToGoal(78, 80, 5, 5)).toBe(0);
  });

  it('no weight lost (totalLostKg ≤ 0) → null', () => {
    expect(getWeeksToGoal(90, 80, 0, 5)).toBeNull();
    expect(getWeeksToGoal(90, 80, -2, 5)).toBeNull();
  });

  it('zero weeks elapsed → null', () => {
    expect(getWeeksToGoal(90, 80, 5, 0)).toBeNull();
  });
});
