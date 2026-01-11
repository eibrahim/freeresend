/**
 * Component tests for AnalyticsTab
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AnalyticsTab from '../AnalyticsTab';

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    getAnalytics: jest.fn(),
  },
}));

// Mock child components
jest.mock('../MetricCard', () => {
  return function MockMetricCard({ title, value, loading }: { title: string; value: string | number; loading?: boolean }) {
    return (
      <div data-testid="metric-card">
        <div>{title}</div>
        <div>{loading ? 'Loading...' : value}</div>
      </div>
    );
  };
});

jest.mock('../TimeSeriesChart', () => {
  return function MockTimeSeriesChart({ data, loading }: { data: unknown[]; loading?: boolean }) {
    return (
      <div data-testid="time-series-chart">
        {loading ? 'Loading chart...' : `Chart with ${data?.length || 0} points`}
      </div>
    );
  };
});

jest.mock('../DateRangePicker', () => {
  return function MockDateRangePicker({
    value,
    onChange,
  }: {
    value: { startDate: string; endDate: string };
    onChange: (range: { startDate: string; endDate: string }) => void;
  }) {
    return (
      <div data-testid="date-range-picker">
        <div>
          {value.startDate} - {value.endDate}
        </div>
        <button
          onClick={() =>
            onChange({
              startDate: '2024-01-01',
              endDate: '2024-01-07',
            })
          }
        >
          Change Range
        </button>
      </div>
    );
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  XCircle: () => <div data-testid="x-icon" />,
  TrendingUp: () => <div data-testid="trend-icon" />,
}));

import { api } from '@/lib/api';

const mockGetAnalytics = api.getAnalytics as jest.MockedFunction<typeof api.getAnalytics>;

const mockAnalyticsData = {
  success: true,
  data: {
    metrics: {
      totalEmails: 1000,
      deliveryRate: 95.5,
      bounceRate: 2.3,
      avgDailyVolume: 33.3,
    },
    statusBreakdown: {
      sent: 100,
      delivered: 955,
      bounced: 23,
      failed: 12,
      complained: 5,
      pending: 5,
    },
    timeSeries: [
      {
        date: '2024-01-01',
        total: 100,
        delivered: 95,
        bounced: 3,
        failed: 2,
      },
      {
        date: '2024-01-02',
        total: 150,
        delivered: 140,
        bounced: 5,
        failed: 5,
      },
    ],
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    },
  },
};

describe('AnalyticsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders analytics header', async () => {
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    expect(screen.getByText('Email Analytics')).toBeInTheDocument();
    expect(
      screen.getByText('Monitor your email performance and delivery metrics over time.')
    ).toBeInTheDocument();
  });

  it('loads analytics data on mount', async () => {
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(mockGetAnalytics).toHaveBeenCalledTimes(1);
    });
  });

  it('displays metric cards with data', async () => {
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Emails')).toBeInTheDocument();
      expect(screen.getByText('Delivery Rate')).toBeInTheDocument();
      expect(screen.getByText('Bounce Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg. Daily Volume')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockGetAnalytics.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAnalyticsData), 100))
    );
    
    render(<AnalyticsTab />);
    
    // Should show loading in metric cards
    const loadingTexts = screen.getAllByText('Loading...');
    expect(loadingTexts.length).toBeGreaterThan(0);
  });

  it('displays time series chart', async () => {
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
  });

  it('displays status breakdown table when data exists', async () => {
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockGetAnalytics.mockRejectedValue(new Error('Failed to fetch analytics'));
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
    });
  });

  it('shows try again button on error', async () => {
    mockGetAnalytics.mockRejectedValue(new Error('Failed to fetch'));
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('retries loading when try again is clicked', async () => {
    const user = userEvent.setup();
    mockGetAnalytics.mockRejectedValueOnce(new Error('Failed'));
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
    
    // Mock successful response for retry
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    await user.click(screen.getByText('Try again'));
    
    await waitFor(() => {
      expect(mockGetAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it('reloads data when date range changes', async () => {
    const user = userEvent.setup();
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(mockGetAnalytics).toHaveBeenCalledTimes(1);
    });
    
    // Change date range
    await user.click(screen.getByText('Change Range'));
    
    await waitFor(() => {
      expect(mockGetAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it('formats large numbers correctly', async () => {
    const largeDataResponse = {
      ...mockAnalyticsData,
      data: {
        ...mockAnalyticsData.data,
        metrics: {
          ...mockAnalyticsData.data.metrics,
          totalEmails: 1500000, // 1.5M
        },
      },
    };
    
    mockGetAnalytics.mockResolvedValue(largeDataResponse);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });
  });

  it('handles zero metrics gracefully', async () => {
    const zeroDataResponse = {
      ...mockAnalyticsData,
      data: {
        ...mockAnalyticsData.data,
        metrics: {
          totalEmails: 0,
          deliveryRate: 0,
          bounceRate: 0,
          avgDailyVolume: 0,
        },
        timeSeries: [],
      },
    };
    
    mockGetAnalytics.mockResolvedValue(zeroDataResponse);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  it('does not show status breakdown when no emails', async () => {
    const noEmailsResponse = {
      ...mockAnalyticsData,
      data: {
        ...mockAnalyticsData.data,
        metrics: {
          ...mockAnalyticsData.data.metrics,
          totalEmails: 0,
        },
      },
    };
    
    mockGetAnalytics.mockResolvedValue(noEmailsResponse);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      expect(screen.queryByText('Status Breakdown')).not.toBeInTheDocument();
    });
  });

  it('renders date range picker', async () => {
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('displays percentage with correct precision', async () => {
    mockGetAnalytics.mockResolvedValue(mockAnalyticsData);
    
    render(<AnalyticsTab />);
    
    await waitFor(() => {
      // Delivery rate should show 1 decimal place
      expect(screen.getByText('95.5%')).toBeInTheDocument();
    });
  });
});
