import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass('rounded-3xl');
    expect(container.firstChild).toHaveClass('bg-cream-50');
  });

  it('applies tone classes', () => {
    const { container } = render(<Card tone="ink">Dark</Card>);
    expect(container.firstChild).toHaveClass('bg-ink-900');
  });
});
