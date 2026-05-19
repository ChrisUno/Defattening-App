import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the uiStore
const mockSetGlobalError = vi.fn();
let mockGlobalError: string | null = null;

vi.mock('../../store/uiStore', () => ({
  useUiStore: (selector: any) => {
    const state = {
      globalError: mockGlobalError,
      setGlobalError: mockSetGlobalError,
    };
    return selector(state);
  },
}));

import { ErrorBanner } from '../ErrorBanner';

beforeEach(() => {
  vi.clearAllMocks();
  mockGlobalError = null;
});

describe('ErrorBanner', () => {
  it('hidden when no error', () => {
    mockGlobalError = null;
    const { container } = render(<ErrorBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows error message', () => {
    mockGlobalError = 'Something went wrong';
    render(<ErrorBanner />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('dismiss button clears error', async () => {
    mockGlobalError = 'Oops';
    render(<ErrorBanner />);
    await userEvent.click(screen.getByLabelText('Dismiss error'));
    expect(mockSetGlobalError).toHaveBeenCalledWith(null);
  });
});
