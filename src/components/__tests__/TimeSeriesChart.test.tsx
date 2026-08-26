/**
 * Component tests for TimeSeriesChart
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeSeriesChart from '../TimeSeriesChart';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockData = [
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
];

describe('TimeSeriesChart', () => {
  it('renders chart with data', () => {
    render(<TimeSeriesChart data={mockData} />);
    
    expect(screen.getByText('Email Volume Over Time')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<TimeSeriesChart data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByText('No emails sent in the selected date range.')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<TimeSeriesChart data={[]} loading={true} />);
    
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
    expect(screen.queryByText('No data available')).not.toBeInTheDocument();
  });

  it('does not render chart during loading', () => {
    render(<TimeSeriesChart data={mockData} loading={true} />);
    
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
  });

  it('renders chart components when data is provided', () => {
    render(<TimeSeriesChart data={mockData} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('handles single data point', () => {
    const singlePoint = [mockData[0]];
    render(<TimeSeriesChart data={singlePoint} />);
    
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('applies correct card styling', () => {
    const { container } = render(<TimeSeriesChart data={mockData} />);
    
    const card = container.querySelector('.bg-white.shadow.rounded-lg');
    expect(card).toBeInTheDocument();
  });

  it('handles null data gracefully', () => {
    render(<TimeSeriesChart data={null as unknown as []} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows spinner during loading', () => {
    const { container } = render(<TimeSeriesChart data={[]} loading={true} />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
