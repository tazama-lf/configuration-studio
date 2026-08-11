import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider, useToast } from './ToastProvider';

const TestConsumer = ({
  onToast,
}: {
  onToast: (toast: ReturnType<typeof useToast>) => void;
}) => {
  const toast = useToast();
  onToast(toast);
  return null;
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide toast functions to children', () => {
    let toastCtx: ReturnType<typeof useToast> | null = null;
    render(
      <ToastProvider>
        <TestConsumer onToast={(t) => (toastCtx = t)} />
      </ToastProvider>,
    );
    expect(toastCtx).not.toBeNull();
    expect(toastCtx!.showSuccess).toBeInstanceOf(Function);
    expect(toastCtx!.showError).toBeInstanceOf(Function);
    expect(toastCtx!.showWarning).toBeInstanceOf(Function);
    expect(toastCtx!.showInfo).toBeInstanceOf(Function);
  });

  it('should throw error when useToast is used outside provider', () => {
    const ConsoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<TestConsumer onToast={() => undefined} />)).toThrow(
      'useToast must be used within a ToastProvider',
    );

    ConsoleErrorSpy.mockRestore();
  });

  it('should render children content', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child Content</div>
      </ToastProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
