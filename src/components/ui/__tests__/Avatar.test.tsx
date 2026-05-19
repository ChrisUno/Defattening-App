import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('renders initials from name', () => {
    render(<Avatar name="John Doe" color="#2563EB" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<Avatar name="Alice" color="#2563EB" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('applies background color', () => {
    const { container } = render(<Avatar name="Test" color="#FF0000" />);
    expect(container.firstChild).toHaveStyle({ backgroundColor: '#FF0000' });
  });

  it('applies size classes', () => {
    const { container } = render(<Avatar name="X Y" color="#000" size="lg" />);
    expect(container.firstChild).toHaveClass('h-14');
  });
});
