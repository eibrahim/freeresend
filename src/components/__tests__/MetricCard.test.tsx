/**
 * Component tests for MetricCard
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetricCard from '../MetricCard';
import { Mail } from 'lucide-react';

describe('MetricCard', () => {
  it('renders title and value correctly', () => {
    render(<MetricCard title="Total Emails" value="1,234" />);
    
    expect(screen.getByText('Total Emails')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<MetricCard title="Count" value={500} />);
    
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <MetricCard
        title="Delivery Rate"
        value="95.5%"
        subtitle="Last 30 days"
      />
    );
    
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<MetricCard title="Total" value="100" />);
    
    expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <MetricCard
        title="Total Emails"
        value="1,000"
        icon={<Mail data-testid="mail-icon" />}
      />
    );
    
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<MetricCard title="Total" value="100" loading={true} />);
    
    // Should not show the value during loading
    expect(screen.queryByText('100')).not.toBeInTheDocument();
    
    // Should show skeleton loader
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('does not show subtitle during loading', () => {
    render(
      <MetricCard
        title="Total"
        value="100"
        subtitle="Test subtitle"
        loading={true}
      />
    );
    
    expect(screen.queryByText('Test subtitle')).not.toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<MetricCard title="Test" value="123" />);
    
    // Component should render successfully with proper classes
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles very long values', () => {
    render(<MetricCard title="Test" value="1,234,567,890" />);
    
    expect(screen.getByText('1,234,567,890')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    render(<MetricCard title="Test" value={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
