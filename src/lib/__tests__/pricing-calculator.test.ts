/**
 * Unit tests for pricing calculator functions
 */

import {
  getResendCost,
  getFreeResendCost,
  getBestHostedTier,
  getHostedCost,
  getFreeResendHostedCost,
  comparePricing,
  formatUSD,
  formatPercent,
  clampVolume,
  calculateSavings,
  HOSTED_PRICING_TIERS
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
    // New defaults: $0 platform fee + $15 hosting + $10 maintenance = $25 base cost
    const testCases: [number, number][] = [
      [0, 25.00],          // Base cost: $0 + $15 + $10
      [1000, 25.10],       // Base + 1k emails = $0.10 SES
      [3000, 25.30],       // Base + 3k emails = $0.30 SES
      [10000, 26.00],      // Base + 10k emails = $1.00 SES
      [50000, 30.00],      // Base + 50k emails = $5.00 SES
      [100000, 35.00],     // Base + 100k emails = $10.00 SES
      [200000, 45.00],     // Base + 200k emails = $20.00 SES
      [500000, 75.00],     // Base + 500k emails = $50.00 SES
      [1000000, 125.00],   // Base + 1M emails = $100.00 SES
      [2500000, 275.00],   // Base + 2.5M emails = $250.00 SES
    ];

    testCases.forEach(([volume, expected]) => {
      const result = getFreeResendCost(volume);
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  it('should handle custom flat fees and SES rates', () => {
    // Custom flat fee (still includes default hosting + maintenance)
    expect(getFreeResendCost(0, 10.00, 0.10)).toBe(35.00); // $10 + $15 + $10

    // Custom SES rate
    expect(getFreeResendCost(10000, 0.00, 0.20)).toBe(27.00); // $0 + $15 + $10 + $2.00 SES

    // Both custom
    expect(getFreeResendCost(50000, 0, 0.05)).toBe(27.50); // $0 + $15 + $10 + $2.50 SES
  });

  it('should handle edge cases', () => {
    // Negative volume clamped to 0
    expect(getFreeResendCost(-1000, 0, 0.10)).toBe(25.00); // Base cost

    // Volume above 5M clamped to 5M
    expect(getFreeResendCost(10000000, 0, 0.10)).toBe(525.00); // Base + $500 SES

    // Negative flat fee clamped to 0
    expect(getFreeResendCost(1000, -5, 0.10)).toBe(25.10); // $0 + $15 + $10 + $0.10 SES

    // Negative SES rate clamped to 0
    expect(getFreeResendCost(1000, 0, -0.10)).toBe(25.00); // Base cost only
  });

  it('should handle fractional calculations precisely', () => {
    // Test that we don't round up to next 1000 - linear pricing
    expect(getFreeResendCost(1, 0, 0.10)).toBe(25.00);      // $0 + $15 + $10 + $0.00 (rounds to nearest cent)
    expect(getFreeResendCost(500, 0, 0.10)).toBe(25.05);    // $0 + $15 + $10 + $0.05
    expect(getFreeResendCost(2500001, 0, 0.10)).toBe(275.00); // Base + $250.00 SES (rounds to nearest cent)
  });
});

describe('getBestHostedTier', () => {
  it('should always return the single hosted tier', () => {
    expect(getBestHostedTier(1000).name).toBe('Hosted');
    expect(getBestHostedTier(3000).name).toBe('Hosted');
    expect(getBestHostedTier(5000).name).toBe('Hosted');
    expect(getBestHostedTier(50000).name).toBe('Hosted');
    expect(getBestHostedTier(1000000).name).toBe('Hosted');
  });

  it('should handle edge cases', () => {
    expect(getBestHostedTier(0).name).toBe('Hosted');
    expect(getBestHostedTier(-1000).name).toBe('Hosted');
    expect(getBestHostedTier(5000000).name).toBe('Hosted');
  });
});

describe('getHostedCost', () => {
  it('should calculate costs correctly for the hosted tier', () => {
    const hostedTier = HOSTED_PRICING_TIERS[0]; // Single hosted tier
    
    // Within free limit (≤3000 emails)
    const result1k = getHostedCost(1000, hostedTier);
    expect(result1k.cost).toBe(0.00);
    expect(result1k.breakdown.baseFee).toBe(0);
    expect(result1k.breakdown.overageEmails).toBe(0);
    expect(result1k.breakdown.overageCost).toBe(0);
    
    // At the free limit
    const result3k = getHostedCost(3000, hostedTier);
    expect(result3k.cost).toBe(0.00);
    expect(result3k.breakdown.baseFee).toBe(0);
    
    // Above free limit - flat $15 fee
    const result5k = getHostedCost(5000, hostedTier);
    expect(result5k.cost).toBe(15.00);
    expect(result5k.breakdown.baseFee).toBe(15);
    expect(result5k.breakdown.overageEmails).toBe(2000);
    expect(result5k.breakdown.overageCost).toBe(0); // No overage cost, just flat fee

    // High volume - still just $15 flat fee
    const result100k = getHostedCost(100000, hostedTier);
    expect(result100k.cost).toBe(15.00);
    expect(result100k.breakdown.baseFee).toBe(15);
    expect(result100k.breakdown.overageEmails).toBe(97000);
    expect(result100k.breakdown.overageCost).toBe(0);

    // Very high volume - still just $15 flat fee
    const result1M = getHostedCost(1000000, hostedTier);
    expect(result1M.cost).toBe(15.00);
    expect(result1M.breakdown.baseFee).toBe(15);
    expect(result1M.breakdown.overageEmails).toBe(997000);
    expect(result1M.breakdown.overageCost).toBe(0);
  });
});

describe('getFreeResendHostedCost', () => {
  it('should return hosted tier costs', () => {
    // Should use single hosted tier for all volumes
    const result1k = getFreeResendHostedCost(1000);
    expect(result1k.tier.name).toBe('Hosted');
    expect(result1k.cost).toBe(0.00); // Free for ≤3000 emails
    
    const result3k = getFreeResendHostedCost(3000);
    expect(result3k.tier.name).toBe('Hosted');
    expect(result3k.cost).toBe(0.00); // Free for ≤3000 emails

    const result5k = getFreeResendHostedCost(5000);
    expect(result5k.tier.name).toBe('Hosted');
    expect(result5k.cost).toBe(15.00); // $15 flat fee for >3000 emails

    const result30k = getFreeResendHostedCost(30000);
    expect(result30k.tier.name).toBe('Hosted');
    expect(result30k.cost).toBe(15.00); // $15 flat fee

    const result1M = getFreeResendHostedCost(1000000);
    expect(result1M.tier.name).toBe('Hosted');
    expect(result1M.cost).toBe(15.00); // $15 flat fee

    const result1_5M = getFreeResendHostedCost(1500000);
    expect(result1_5M.tier.name).toBe('Hosted');
    expect(result1_5M.cost).toBe(15.00); // $15 flat fee
  });
});

describe('comparePricing', () => {
  it('should include hosted pricing in comparisons', () => {
    const result = comparePricing(50000, 0.00, 0.10);

    // Should include all three pricing options
    expect(result.resendCost).toBe(20);
    expect(result.freeResendCost).toBe(30.00); // $0 + $15 + $10 + $5 SES
    expect(result.hostedCost).toBe(20.00); // $15 service fee + $5 SES

    // Should calculate savings vs Resend for both options
    expect(result.savingsAbs).toBeCloseTo(-10.00, 2); // Self-hosted is more expensive
    expect(result.savingsPct).toBeCloseTo(-50.0, 1);
    expect(result.hostedSavingsAbs).toBeCloseTo(0.00, 2); // Hosted same cost as Resend
    expect(result.hostedSavingsPct).toBeCloseTo(0.0, 1);

    // Should include hosted tier info
    expect(result.hostedTier.name).toBe('Hosted');
  });

  it('should handle cases where hosted is cheaper than Resend', () => {
    const result = comparePricing(200000, 5.00, 0.10);

    expect(result.resendCost).toBe(160);
    expect(result.hostedCost).toBe(35.00); // $15 service fee + $20 SES
    expect(result.hostedSavingsAbs).toBeCloseTo(125.00, 2);
    expect(result.hostedSavingsPct).toBeCloseTo(78.1, 1);
  });

  it('should match acceptance criteria exactly', () => {
    const testCases: [number, number | null, number, number, number | null, number | null][] = [
      // [volume, resendCost, freeResendCost, hostedCost, savingsAbs, savingsPct]
      [1000, 0, 25.10, 0.10, null, null],                   // Free tier - no savings calc
      [3000, 0, 25.30, 0.30, null, null],                   // Free tier - no savings calc
      [5000, 20, 25.50, 15.50, -5.50, -27.5],              // Self-hosted more expensive
      [50000, 20, 30.00, 20.00, -10.00, -50.0],            // Self-hosted more expensive, hosted same
      [100000, 35, 35.00, 25.00, 0.00, 0.0],               // Self-hosted same cost, hosted cheaper
      [200000, 160, 45.00, 35.00, 115.00, 71.9],           // Both much cheaper than Resend
      [500000, 350, 75.00, 65.00, 275.00, 78.6],           // Both much cheaper than Resend
      [1000000, 650, 125.00, 115.00, 525.00, 80.8],        // Both much cheaper than Resend
      [2500000, 1050, 275.00, 265.00, 775.00, 73.8],       // Both much cheaper than Resend
      [2500001, null, 275.00, 265.00, null, null],         // Contact sales - no savings
    ];

    testCases.forEach(([volume, expectedResend, expectedFreeResend, expectedHosted, expectedSavingsAbs, expectedSavingsPct]) => {
      const result = comparePricing(volume, 0.00, 0.10);

      expect(result.resendCost).toBe(expectedResend);
      expect(result.freeResendCost).toBeCloseTo(expectedFreeResend, 2);
      expect(result.hostedCost).toBeCloseTo(expectedHosted, 2);

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
    expect(result3k.hostedTier.name).toBe('Hosted');

    const result50k = comparePricing(50000);
    expect(result50k.resendPlan).toBe('Pro');
    expect(result50k.hostedTier.name).toBe('Hosted');

    const result3M = comparePricing(3000000);
    expect(result3M.resendPlan).toBe('Contact Sales');
    expect(result3M.resendNote).toContain('Custom pricing');
    expect(result3M.hostedTier.name).toBe('Hosted');
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
    expect(result.freeResendCost).toBe(30.00); // $0 + $15 + $10 + $5 SES
    expect(result.hostedCost).toBe(20.00); // $15 service fee + $5 SES
    expect(result.savingsAbs).toBeCloseTo(-10.00, 2); // Self-hosted more expensive
    expect(result.savingsPct).toBeCloseTo(-50.0, 1);
    expect(result.hostedSavingsAbs).toBeCloseTo(0.00, 2); // Hosted same cost as Resend
    expect(result.hostedSavingsPct).toBeCloseTo(0.0, 1);
  });

  it('should handle custom parameters', () => {
    const result = calculateSavings({
      volume: 100000,
      flatFee: 0,
      sesRate: 0.05
    });

    expect(result.resendCost).toBe(35);
    expect(result.freeResendCost).toBe(30.00); // $0 + $15 + $10 + $5 SES
    expect(result.hostedCost).toBe(20.00); // $15 service fee + $5 SES
    expect(result.savingsAbs).toBeCloseTo(5.00, 2);
    expect(result.savingsPct).toBeCloseTo(14.3, 1);
    expect(result.hostedSavingsAbs).toBeCloseTo(15.00, 2);
    expect(result.hostedSavingsPct).toBeCloseTo(42.9, 1);
  });
});

describe('HOSTED_PRICING_TIERS', () => {
  it('should have correct tier structure', () => {
    expect(HOSTED_PRICING_TIERS).toHaveLength(1);

    const [hosted] = HOSTED_PRICING_TIERS;

    // Single hosted tier
    expect(hosted.name).toBe('Hosted');
    expect(hosted.monthlyFee).toBe(0); // Free for first 3000 emails
    expect(hosted.includedEmails).toBe(3000);
    expect(hosted.overageRate).toBe(15); // $15 flat fee after 3000 emails
    expect(hosted.recommended).toBe(true);
    expect(hosted.features).toContain('First 3,000 emails free');
    expect(hosted.features).toContain('$15/month flat fee after 3,000 emails');
    expect(hosted.features).toContain('Use your own SES keys');
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
    const result = comparePricing(2500001, 0.00, 0.10);

    expect(result.freeResendCost).toBe(275.00);  // $0 + $15 + $10 + $250 SES (rounded to nearest cent)
    expect(result.resendCost).toBeNull();
    expect(result.savingsAbs).toBeNull();
  });
});