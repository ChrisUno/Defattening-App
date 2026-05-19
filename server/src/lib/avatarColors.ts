export const AVATAR_COLORS = [
  '#2563EB', '#1D4ED8', '#0EA5E9', '#0284C7', '#06B6D4',
  '#0891B2', '#3B82F6', '#6366F1', '#4F46E5', '#7C3AED',
  '#8B5CF6', '#0F766E', '#14B8A6',
];

export const pickColor = () =>
  AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
