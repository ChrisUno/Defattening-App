interface WeightComparison {
  kg: number;
  emoji: string;
  label: string;
}

const personalComparisons: WeightComparison[] = [
  { kg: 0.2, emoji: '🧈', label: 'a stick of butter' },
  { kg: 0.5, emoji: '🍞', label: 'a loaf of bread' },
  { kg: 1.0, emoji: '🍬', label: 'a bag of sugar' },
  { kg: 1.5, emoji: '🍍', label: 'a pineapple' },
  { kg: 2.0, emoji: '🍖', label: 'a rack of ribs' },
  { kg: 2.5, emoji: '🐕', label: 'a Chihuahua' },
  { kg: 3.5, emoji: '👶', label: 'a newborn baby' },
  { kg: 4.5, emoji: '🐱', label: 'a house cat' },
  { kg: 5.0, emoji: '🎳', label: 'a bowling ball' },
  { kg: 7.0, emoji: '💧', label: 'a gallon jug of water' },
  { kg: 8.0, emoji: '🍉', label: 'a watermelon' },
  { kg: 10, emoji: '🛞', label: 'a car tire' },
  { kg: 12, emoji: '🐶', label: 'a medium dog' },
  { kg: 15, emoji: '📦', label: 'a microwave oven' },
  { kg: 20, emoji: '🥇', label: 'a gold bar' },
];

const sessionComparisons: WeightComparison[] = [
  { kg: 5, emoji: '🎳', label: 'a bowling ball' },
  { kg: 10, emoji: '🛞', label: 'a car tire' },
  { kg: 20, emoji: '🥇', label: 'a gold bar' },
  { kg: 30, emoji: '🐕', label: 'a Labrador retriever' },
  { kg: 50, emoji: '🦛', label: 'a baby hippo' },
  { kg: 75, emoji: '🎹', label: 'a baby grand piano bench' },
  { kg: 100, emoji: '🦍', label: 'a baby gorilla' },
  { kg: 150, emoji: '🐼', label: 'a full-grown giant panda' },
  { kg: 200, emoji: '🐘', label: 'a baby elephant' },
  { kg: 300, emoji: '🏪', label: 'a vending machine' },
  { kg: 500, emoji: '🎹', label: 'a grand piano' },
];

function findClosest(table: WeightComparison[], kg: number): { emoji: string; label: string } {
  let best = table[0];
  let bestDiff = Math.abs(kg - best.kg);
  for (let i = 1; i < table.length; i++) {
    const diff = Math.abs(kg - table[i].kg);
    if (diff < bestDiff) {
      best = table[i];
      bestDiff = diff;
    }
  }
  return { emoji: best.emoji, label: best.label };
}

export function getWeightComparison(kg: number): { emoji: string; label: string } {
  return findClosest(personalComparisons, kg);
}

export function getSessionWeightComparison(kg: number): { emoji: string; label: string } {
  return findClosest(sessionComparisons, kg);
}

export function getWeeksToGoal(
  currentWeightKg: number,
  goalWeightKg: number,
  totalLostKg: number,
  weeksElapsed: number,
): number | null {
  if (totalLostKg <= 0 || weeksElapsed <= 0) return null;
  const avgLossPerWeek = totalLostKg / weeksElapsed;
  const remainingKg = currentWeightKg - goalWeightKg;
  if (remainingKg <= 0) return 0;
  return Math.ceil(remainingKg / avgLossPerWeek);
}
