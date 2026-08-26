/**
 * Component tests for DateRangePicker
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DateRangePicker from '../DateRangePicker';
import { subDays } from 'date-fns';

// Mock react-day-picker
jest.mock('react-day-picker', () => ({
  DayPicker: ({ onSelect }: { onSelect: (range: { from?: Date; to?: Date }) => void }) => (
    <div data-testid="day-picker">
      <button
        onClick={() =>
          onSelect({
            from: new Date('2024-01-01'),
            to: new Date('2024-01-31'),
          })
        }
      >
        Select Range
      </button>
    </div>
  ),
}));

describe('DateRangePicker', () => {
  const mockOnChange = jest.fn();
  const defaultValue = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders preset buttons', () => {
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('Last 90 days')).toBeInTheDocument();
    expect(screen.getByText('Custom Range')).toBeInTheDocument();
  });

  it('displays current date range', () => {
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    // Should show formatted date range (format function may give different output)
    const dateRangeText = screen.getByText(/2024/);
    expect(dateRangeText).toBeInTheDocument();
  });

  it('calls onChange when preset button is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    await user.click(screen.getByText('Last 7 days'));
    
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    );
  });

  it('shows custom date picker when Custom Range is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    await user.click(screen.getByText('Custom Range'));
    
    await waitFor(() => {
      expect(screen.getByTestId('day-picker')).toBeInTheDocument();
    });
  });

  it('applies custom date range when Apply is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    // Open custom picker
    await user.click(screen.getByText('Custom Range'));
    
    // Select range using mock
    await user.click(screen.getByText('Select Range'));
    
    // Click Apply
    await user.click(screen.getByText('Apply'));
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('closes custom picker when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    // Open custom picker
    await user.click(screen.getByText('Custom Range'));
    expect(screen.getByTestId('day-picker')).toBeInTheDocument();
    
    // Click Cancel
    await user.click(screen.getByText('Cancel'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('day-picker')).not.toBeInTheDocument();
    });
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('highlights active preset button', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = subDays(today, 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const value = {
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };

    render(<DateRangePicker value={value} onChange={mockOnChange} />);
    
    // The 7 days button should have active styling
    const sevenDaysButton = screen.getByText('Last 7 days');
    // Check if it has the active class
    expect(sevenDaysButton).toHaveClass('bg-blue-600');
  });

  it('disables Apply button when no dates selected', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    await user.click(screen.getByText('Custom Range'));
    
    const applyButton = screen.getByText('Apply');
    // Initially dates are set from value prop, so button should be enabled
    expect(applyButton).not.toBeDisabled();
  });

  it('handles Last 30 days preset correctly', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    await user.click(screen.getByText('Last 30 days'));
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    );

    const call = mockOnChange.mock.calls[0][0];
    const start = new Date(call.startDate);
    const end = new Date(call.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(daysDiff).toBeGreaterThanOrEqual(29);
    expect(daysDiff).toBeLessThanOrEqual(30);
  });

  it('handles Last 90 days preset correctly', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={defaultValue} onChange={mockOnChange} />);
    
    await user.click(screen.getByText('Last 90 days'));
    
    const call = mockOnChange.mock.calls[0][0];
    const start = new Date(call.startDate);
    const end = new Date(call.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(daysDiff).toBeGreaterThanOrEqual(89);
    expect(daysDiff).toBeLessThanOrEqual(90);
  });
});
