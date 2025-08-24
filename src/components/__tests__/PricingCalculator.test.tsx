/**
 * Component tests for PricingCalculator
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PricingCalculator from '../PricingCalculator';

// Mock WaitlistSignup component
jest.mock('../WaitlistSignup', () => {
  return function MockWaitlistSignup({ 
    estimatedVolume, 
    onSuccess, 
    compact, 
    trackingContext 
  }: {
    estimatedVolume?: number;
    onSuccess?: () => void;
    compact?: boolean;
    trackingContext?: string;
  }) {
    return (
      <div data-testid="waitlist-signup">
        <div>Estimated Volume: {estimatedVolume}</div>
        <div>Compact: {compact ? 'true' : 'false'}</div>
        <div>Tracking Context: {trackingContext}</div>
        <input 
          aria-label="Email Address *" 
          placeholder="test@example.com"
          data-testid="waitlist-email"
        />
        <button 
          onClick={() => onSuccess?.()}
          data-testid="waitlist-submit"
        >
          Join Waitlist
        </button>
      </div>
    );
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// @ts-expect-error - Mock localStorage for testing
global.localStorage = localStorageMock;

describe('PricingCalculator', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Reset localStorage to return null for all keys by default
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset any global state
    jest.clearAllMocks();
  });

  it('renders with all pricing options', () => {
    render(<PricingCalculator />);
    
    // Check that all four cost cards are present
    expect(screen.getByText('Resend')).toBeInTheDocument();
    expect(screen.getByText('Self-Hosted')).toBeInTheDocument();
    expect(screen.getByText('Hosted')).toBeInTheDocument();
    expect(screen.getByText('Best Savings')).toBeInTheDocument();
    
    // Check hosted pricing details section
    expect(screen.getByText(/Hosted Version:/)).toBeInTheDocument();
  });

  it('shows hosted pricing tiers correctly', () => {
    render(<PricingCalculator />);
    
    // Should show hosted pricing details section
    expect(screen.getByText(/Hosted Version:/)).toBeInTheDocument();
    expect(screen.getByText('Pricing Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('displays waitlist signup by default', () => {
    render(<PricingCalculator />);
    
    // Should show waitlist signup section
    expect(screen.getByText('Get Early Access to Hosted Version')).toBeInTheDocument();
    expect(screen.getByText('Join the waitlist and be the first to know when it launches')).toBeInTheDocument();
  });

  it('can be rendered in embeddable mode', () => {
    render(<PricingCalculator embeddable={true} />);
    
    // Should still show the cost cards
    expect(screen.getByText('Resend')).toBeInTheDocument();
    expect(screen.getByText('Self-Hosted')).toBeInTheDocument();
    expect(screen.getByText('Hosted')).toBeInTheDocument();
    
    // Should not show waitlist signup in embeddable mode
    expect(screen.queryByText('Get Early Access to Hosted Version')).not.toBeInTheDocument();
  });

  it('can hide waitlist signup', () => {
    render(<PricingCalculator showWaitlist={false} />);
    
    // Should not show waitlist signup
    expect(screen.queryByText('Get Early Access to Hosted Version')).not.toBeInTheDocument();
    
    // Should show coming soon message instead
    expect(screen.getByText('Coming Soon:')).toBeInTheDocument();
  });

  it('handles waitlist success state', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Initially should not show success state
    expect(screen.queryByText('On Waitlist ✓')).not.toBeInTheDocument();
    
    // Click the mock submit button to trigger success
    const submitButton = screen.getByTestId('waitlist-submit');
    await user.click(submitButton);
    
    // Hosted card should show waitlist success indicator
    await waitFor(() => {
      expect(screen.getByText('On Waitlist ✓')).toBeInTheDocument();
      expect(screen.getByText("You're on the waitlist! We'll notify you when it's ready.")).toBeInTheDocument();
    });
  });
});