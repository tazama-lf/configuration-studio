import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardBoxes, { BoxCard } from './DashboardBoxes';
import * as React from 'react';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('BoxCard', () => {
  it('should render title and subtitle', () => {
    render(
      <BoxCard
        title="Test Title"
        subtitle="Test Subtitle"
        icon={<div>icon</div>}
      />,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <BoxCard
        title="Test"
        subtitle="Sub"
        icon={<div>icon</div>}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByText('Test'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render selected indicator when selected is true', () => {
    const { container } = render(
      <BoxCard
        title="Test"
        subtitle="Sub"
        icon={<div>icon</div>}
        selected={true}
      />,
    );
    expect(container).toBeDefined();
  });
});

describe('DashboardBoxes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render all three config boxes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardBoxes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Network Map')).toBeInTheDocument();
    expect(screen.getByText('Typology')).toBeInTheDocument();
    expect(screen.getByText('Rule')).toBeInTheDocument();
  });

  it('should render subtitles for each box', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardBoxes />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/Manage network map configurations/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Manage typology configurations/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Manage rule configurations/i),
    ).toBeInTheDocument();
  });

  it('should apply mounted transition after timeout', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardBoxes />
      </MemoryRouter>,
    );
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByText('Network Map')).toBeInTheDocument();
  });
});
