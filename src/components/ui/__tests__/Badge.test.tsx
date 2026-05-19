import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies tone classes', () => {
    const { container } = render(<Badge tone="grape">VIP</Badge>);
    expect(container.firstChild).toHaveClass('bg-grape-50');
  });

  it('defaults to cream tone', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-cream-100');
  });
});
