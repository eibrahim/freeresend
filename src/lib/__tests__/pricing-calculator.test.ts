/**
 * Unit tests for pricing calculator functions
 */

import {
  getResendCost,
  getFreeResendCost,
  comparePricing,
  formatUSD,
  formatPercent,
  clampVolume,
  calculateSavings
} from '../pricing-calculator';

describe('getResendCost', () => {
  it('should return correct costs for all pricing tiers', () => {
    // Test all tier boundaries and spot checks
    const testCases: [number, number | null, string][] = [
      [0, 0, 'Free'],
      [3000, 0, 'Free'],
      [3001, 20, 'Pro'],
      [50000, 20, 'Pro'],
      [50001, 35, 'Business'],
      [100000, 35, 'Business'],
      [100001, 160, 'Scale'],
      [200000, 160, 'Scale'],
      [200001, 350, 'Enterprise'],
      [500000, 350, 'Enterprise'],
      [500001, 650, 'Enterprise+'],
      [1000000, 650, 'Enterprise+'],
      [1000001, 825, 'Enterprise++'],
      [1500000, 825, 'Enterprise++'],
      [1500001, 1050, 'Enterprise Max'],
      [2500000, 1050, 'Enterprise Max'],
      [2500001, null, 'Contact Sales'],
      [5000000, null, 'Contact Sales'],
    ];

    testCases.forEach(([volume, expectedCost, expectedPlan]) => {
      const result = getResendCost(volume);
      expect(result.cost).toBe(expectedCost);
      expect(result.plan).toBe(expectedPlan);
    });
  });

  it('should handle edge cases with volume clamping', () => {
    // Negative volumes should be clamped to 0
    expect(getResendCost(-1000)).toEqual({
      cost: 0,
      plan: 'Free',
      note: 'Free tier includes up to 3,000 emails'
    });

    // Volumes above 5M should be clamped to 5M
    expect(getResendCost(10000000)).toEqual({
      cost: null,
      plan: 'Contact Sales',
      note: 'Custom pricing for volumes over 2.5M emails/month'
    });
  });

  it('should include appropriate notes', () => {
    // Free tier should include note
    const freeResult = getResendCost(0);
    expect(freeResult.note).toBe('Free tier includes up to 3,000 emails');

    // Contact sales should include note
    const contactResult = getResendCost(3000000);
    expect(contactResult.note).toBe('Custom pricing for volumes over 2.5M emails/month');

    // Paid tiers should not include notes
    const paidResult = getResendCost(50000);
    expect(paidResult.note).toBeUndefined();
  });
});

describe('getFreeResendCost', () => {
  it('should calculate correct costs with default parameters', () => {
    const testCases: [number, number][] = [
      [0, 5.00],          // Just flat fee
      [1000, 5.10],       // 1k emails = $0.10 SES
      [3000, 5.30],       // 3k emails = $0.30 SES
      [10000, 6.00],      // 10k emails = $1.00 SES
      [50000, 10.00],     // 50k emails = $5.00 SES
      [100000, 15.00],    // 100k emails = $10.00 SES
      [200000, 25.00],    // 200k emails = $20.00 SES
      [500000, 55.00],    // 500k emails = $50.00 SES
      [1000000, 105.00],  // 1M emails = $100.00 SES
      [2500000, 255.00],  // 2.5M emails = $250.00 SES
    ];

    testCases.forEach(([volume, expected]) => {
      const result = getFreeResendCost(volume);
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  it('should handle custom flat fees and SES rates', () => {
    // Custom flat fee
    expect(getFreeResendCost(0, 10.00, 0.10)).toBe(10.00);
    
    // Custom SES rate
    expect(getFreeResendCost(10000, 5.00, 0.20)).toBe(7.00);
    
    // Both custom
    expect(getFreeResendCost(50000, 0, 0.05)).toBe(2.50);
  });

  it('should handle edge cases', () => {
    // Negative volume clamped to 0
    expect(getFreeResendCost(-1000, 5, 0.10)).toBe(5.00);
    
    // Volume above 5M clamped to 5M
    expect(getFreeResendCost(10000000, 5, 0.10)).toBe(505.00);
    
    // Negative flat fee clamped to 0
    expect(getFreeResendCost(1000, -5, 0.10)).toBe(0.10);
    
    // Negative SES rate clamped to 0
    expect(getFreeResendCost(1000, 5, -0.10)).toBe(5.00);
  });

  it('should handle fractional calculations precisely', () => {
    // Test that we don't round up to next 1000 - linear pricing
    expect(getFreeResendCost(1, 0, 0.10)).toBe(0.00);      // Rounds to nearest cent
    expect(getFreeResendCost(500, 0, 0.10)).toBe(0.05);    
    expect(getFreeResendCost(2500001, 5, 0.10)).toBe(255.00); // Rounds to nearest cent
  });
});

describe('comparePricing', () => {
  it('should match acceptance criteria exactly', () => {
    const testCases: [number, number | null, number, number | null, number | null][] = [
      // [volume, resendCost, freeResendCost, savingsAbs, savingsPct]
      [3000, 0, 5.30, null, null],                    // Free tier - no savings calc
      [50000, 20, 10.00, 10.00, 50.0],               // 50% savings
      [100000, 35, 15.00, 20.00, 57.1],              // 57.1% savings  
      [200000, 160, 25.00, 135.00, 84.4],            // 84.4% savings
      [500000, 350, 55.00, 295.00, 84.3],            // 84.3% savings
      [1000000, 650, 105.00, 545.00, 83.8],          // 83.8% savings
      [2500000, 1050, 255.00, 795.00, 75.7],         // 75.7% savings
      [2500001, null, 255.00, null, null],           // Contact sales - no savings (rounded)
    ];

    testCases.forEach(([volume, expectedResend, expectedFreeResend, expectedSavingsAbs, expectedSavingsPct]) => {
      const result = comparePricing(volume, 5.00, 0.10);
      
      expect(result.resendCost).toBe(expectedResend);
      expect(result.freeResendCost).toBeCloseTo(expectedFreeResend, 2);
      
      if (expectedSavingsAbs !== null) {
        expect(result.savingsAbs).toBeCloseTo(expectedSavingsAbs, 2);
      } else {
        expect(result.savingsAbs).toBeNull();
      }
      
      if (expectedSavingsPct !== null) {
        expect(result.savingsPct).toBeCloseTo(expectedSavingsPct, 1);
      } else {
        expect(result.savingsPct).toBeNull();
      }
    });
  });

  it('should include correct plan information', () => {
    const result3k = comparePricing(3000);
    expect(result3k.resendPlan).toBe('Free');
    
    const result50k = comparePricing(50000);
    expect(result50k.resendPlan).toBe('Pro');
    
    const result3M = comparePricing(3000000);
    expect(result3M.resendPlan).toBe('Contact Sales');
    expect(result3M.resendNote).toContain('Custom pricing');
  });
});

describe('formatUSD', () => {
  it('should format currency correctly', () => {
    expect(formatUSD(0)).toBe('$0.00');
    expect(formatUSD(5.3)).toBe('$5.30');
    expect(formatUSD(10)).toBe('$10.00');
    expect(formatUSD(1000)).toBe('$1,000.00');
    expect(formatUSD(1234.56)).toBe('$1,234.56');
    expect(formatUSD(1000000)).toBe('$1,000,000.00');
  });
});

describe('formatPercent', () => {
  it('should format percentages correctly', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(50.0)).toBe('50.0%');
    expect(formatPercent(84.375)).toBe('84.4%');
    expect(formatPercent(100)).toBe('100.0%');
  });
});

describe('clampVolume', () => {
  it('should clamp values to valid range', () => {
    expect(clampVolume(-1000)).toBe(0);
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(1000)).toBe(1000);
    expect(clampVolume(5000000)).toBe(5000000);
    expect(clampVolume(10000000)).toBe(5000000);
  });
});

describe('calculateSavings', () => {
  it('should provide simplified interface for external use', () => {
    const result = calculateSavings({ volume: 50000 });
    
    expect(result.resendCost).toBe(20);
    expect(result.freeResendCost).toBe(10.00);
    expect(result.savingsAbs).toBeCloseTo(10.00, 2);
    expect(result.savingsPct).toBeCloseTo(50.0, 1);
  });

  it('should handle custom parameters', () => {
    const result = calculateSavings({
      volume: 100000,
      flatFee: 0,
      sesRate: 0.05
    });
    
    expect(result.resendCost).toBe(35);
    expect(result.freeResendCost).toBe(5.00);
    expect(result.savingsAbs).toBeCloseTo(30.00, 2);
    expect(result.savingsPct).toBeCloseTo(85.7, 1);
  });
});

describe('Integration tests', () => {
  it('should handle all boundary conditions correctly', () => {
    // Test tier boundaries don't have off-by-one errors
    const boundaryTests = [
      [2999, 0],    // Just below free limit
      [3000, 0],    // At free limit
      [3001, 20],   // Just above free limit
      [49999, 20],  // Just below next tier
      [50000, 20],  // At tier limit
      [50001, 35],  // Just above tier limit
    ];

    boundaryTests.forEach(([volume, expectedCost]) => {
      const result = getResendCost(volume);
      expect(result.cost).toBe(expectedCost);
    });
  });

  it('should maintain precision for large volumes', () => {
    // Ensure calculations remain precise at high volumes
    const result = comparePricing(2500001, 5.00, 0.10);
    
    expect(result.freeResendCost).toBe(255.00);  // Rounded to nearest cent
    expect(result.resendCost).toBeNull();
    expect(result.savingsAbs).toBeNull();
  });
});