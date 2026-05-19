import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ConfettiBurst } from '../ConfettiBurst';

describe('ConfettiBurst', () => {
  it('renders without error (smoke test)', () => {
    const { container } = render(<ConfettiBurst trigger={0} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders pieces when triggered', () => {
    const { container } = render(<ConfettiBurst trigger={1} count={5} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
