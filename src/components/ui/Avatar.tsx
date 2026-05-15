import { cn } from '../../lib/cn';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const Avatar = ({ name, color, size = 'md', className }: AvatarProps) => (
  <span
    className={cn(
      'inline-flex items-center justify-center rounded-full font-bold text-cream-50 border-2 border-cream-50 shadow-sm',
      sizeClasses[size],
      className,
    )}
    style={{ backgroundColor: color }}
  >
    {initials(name)}
  </span>
);
