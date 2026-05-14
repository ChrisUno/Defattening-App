import { useUiStore } from '../store/uiStore';

interface ChartTokens {
  surface: string;
  border: string;
  axisLabel: string;
  textPrimary: string;
  grid: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  success: string;
  successDark: string;
}

const light: ChartTokens = {
  surface: '#FFFFFF',
  border: 'rgba(11, 23, 51, 0.1)',
  axisLabel: '#475569',
  textPrimary: '#0B1733',
  grid: 'rgba(11, 23, 51, 0.08)',
  primary: '#2563EB',
  primarySoft: 'rgba(37, 99, 235, 0.12)',
  secondary: '#4338CA',
  success: '#16A34A',
  successDark: '#15803D',
};

const dark: ChartTokens = {
  surface: '#142244',
  border: 'rgba(248, 250, 252, 0.16)',
  axisLabel: '#94A3B8',
  textPrimary: '#F8FAFC',
  grid: 'rgba(248, 250, 252, 0.12)',
  primary: '#60A5FA',
  primarySoft: 'rgba(96, 165, 250, 0.18)',
  secondary: '#A5B4FC',
  success: '#22C55E',
  successDark: '#86EFAC',
};

export const useChartTokens = (): ChartTokens => {
  const theme = useUiStore((s) => s.theme);
  return theme === 'dark' ? dark : light;
};
