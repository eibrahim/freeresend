/**
 * Component tests for PricingCalculator
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PricingCalculator from '../PricingCalculator';

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
  });

  it('renders with default values', () => {
    render(<PricingCalculator />);
    
    // Check main title
    expect(screen.getByText('Pricing Calculator')).toBeInTheDocument();
    
    // Check that all three cost cards are present
    expect(screen.getByText('Resend Cost')).toBeInTheDocument();
    expect(screen.getByText('FreeResend Cost')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('displays correct default calculations', () => {
    render(<PricingCalculator />);
    
    // Default: 50,000 emails should show Resend at $20, FreeResend at $10
    expect(screen.getByText('$20.00')).toBeInTheDocument(); // Resend cost
    
    // Check for FreeResend cost by finding it within the FreeResend Cost card
    const freeResendCard = screen.getByText('FreeResend Cost').closest('.bg-white');
    expect(freeResendCard).toContainElement(screen.getAllByText('$10.00')[0]);
    
    // Check savings percentage
    expect(screen.getByText('50.0% savings')).toBeInTheDocument();
  });

  it('updates calculations when volume changes', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Find volume input and change to 100,000
    const volumeInput = screen.getByDisplayValue('50000');
    await user.clear(volumeInput);
    await user.type(volumeInput, '100000');
    
    // Should show updated calculations
    await waitFor(() => {
      expect(screen.getByText('$35.00')).toBeInTheDocument(); // Resend cost for 100k
      expect(screen.getByText('$15.00')).toBeInTheDocument(); // FreeResend cost for 100k
    });
  });

  it('handles quick-pick buttons correctly', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Click on 100K quick-pick button
    const button100k = screen.getByRole('button', { name: /set volume to 100k/i });
    await user.click(button100k);
    
    // Volume input should update
    await waitFor(() => {
      expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
    });
  });

  it('shows correct calculations for free tier', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Set volume to 3000 (free tier)
    const volumeInput = screen.getByDisplayValue('50000');
    await user.clear(volumeInput);
    await user.type(volumeInput, '3000');
    
    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument(); // Resend free
      expect(screen.getByText('$5.30')).toBeInTheDocument(); // FreeResend cost
      expect(screen.getByText('N/A')).toBeInTheDocument(); // No savings calculation
    });
  });

  it('shows contact sales for high volumes', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Set volume above 2.5M
    const volumeInput = screen.getByDisplayValue('50000');
    await user.clear(volumeInput);
    await user.type(volumeInput, '3000000');
    
    await waitFor(() => {
      expect(screen.getByText('Contact Sales')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument(); // No savings
    });
  });

  it('allows customizing flat fee and SES rate', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PricingCalculator showAdvanced={true} />);
    
    // Change flat fee to $10
    const flatFeeInput = screen.getByDisplayValue('5.00');
    await user.clear(flatFeeInput);
    await user.type(flatFeeInput, '10.00');
    
    // Should update FreeResend calculation
    await waitFor(() => {
      expect(screen.getByText('$15.00')).toBeInTheDocument(); // $10 flat + $5 SES for 50k
    });
    
    // Clean up
    unmount();
  });

  it('validates volume input bounds', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Try to set negative volume
    const volumeInput = screen.getByDisplayValue('50000');
    await user.clear(volumeInput);
    await user.type(volumeInput, '-1000');
    
    await waitFor(() => {
      // Should clamp to 0
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });
  });

  it('can be rendered in embeddable mode', () => {
    render(<PricingCalculator embeddable={true} />);
    
    // Should not show the main title in embeddable mode
    expect(screen.queryByText('Pricing Calculator')).not.toBeInTheDocument();
    
    // But should still show the cost cards
    expect(screen.getByText('Resend Cost')).toBeInTheDocument();
    expect(screen.getByText('FreeResend Cost')).toBeInTheDocument();
  });

  it('persists values to localStorage', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Change volume
    const volumeInput = screen.getByDisplayValue('50000');
    await user.clear(volumeInput);
    await user.type(volumeInput, '100000');
    
    await waitFor(() => {
      // Should call localStorage.setItem with the new volume
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pricing-calculator-volume',
        '100000'
      );
    });
  });

  it('loads values from localStorage on mount', () => {
    // Mock localStorage returning saved values
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'pricing-calculator-volume') return '75000';
      if (key === 'pricing-calculator-flat-fee') return '7.50';
      if (key === 'pricing-calculator-ses-rate') return '0.15';
      return null;
    });
    
    render(<PricingCalculator />);
    
    // Should load saved values
    expect(screen.getByDisplayValue('75000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7.50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.15')).toBeInTheDocument();
  });

  it('shows correct plan names for different volumes', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Test different volumes and their plan names
    const testCases = [
      { volume: '3000', plan: 'Free' },
      { volume: '25000', plan: 'Pro' },
      { volume: '75000', plan: 'Business' },
      { volume: '150000', plan: 'Scale' },
    ];
    
    const volumeInput = screen.getByDisplayValue('50000');
    
    for (const testCase of testCases) {
      await user.clear(volumeInput);
      await user.type(volumeInput, testCase.volume);
      
      await waitFor(() => {
        expect(screen.getByText(testCase.plan)).toBeInTheDocument();
      });
    }
  });

  it('handles slider interactions', async () => {
    render(<PricingCalculator />);
    
    // Find the range slider
    const slider = screen.getByLabelText('Volume slider');
    
    // Simulate sliding to 100,000
    fireEvent.change(slider, { target: { value: '100000' } });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
    });
  });

  it('shows formula details when requested', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator showAdvanced={true} />);
    
    // Click show details button
    const showDetailsButton = screen.getByText('Show Details');
    await user.click(showDetailsButton);
    
    // Should show formula
    await waitFor(() => {
      expect(screen.getByText('Calculation Formula:')).toBeInTheDocument();
    });
  });

  it('formats large numbers correctly', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);
    
    // Set volume to 1M
    const volumeInput = screen.getByDisplayValue('50000');
    await user.clear(volumeInput);
    await user.type(volumeInput, '1000000');
    
    await waitFor(() => {
      // Should show formatted volume
      expect(screen.getByText('1.0M emails/month')).toBeInTheDocument();
    });
  });

  it('highlights savings when present', async () => {
    render(<PricingCalculator />);
    
    // Default 50K volume should show savings
    await waitFor(() => {
      expect(screen.getByText('50.0% savings')).toBeInTheDocument();
    });
  });
});