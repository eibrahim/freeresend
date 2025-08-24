/**
 * Pricing Calculator Engine for Resend vs FreeResend comparison
 * 
 * This module provides pure functions for calculating email service costs
 * and comparing pricing between different providers.
 */

export interface ResendQuote {
  cost: number | null;
  plan: string;
  note?: string;
}

export interface HostedPricingTier {
  name: string;
  monthlyFee: number;
  includedEmails: number;
  overageRate: number; // per 1000 emails
  features: string[];
  recommended?: boolean;
}

export interface HostedQuote {
  cost: number;
  tier: HostedPricingTier;
  breakdown: {
    baseFee: number;
    overageEmails: number;
    overageCost: number;
  };
}

export interface SelfHostedBreakdown {
  sesCost: number;
  flatFee: number;
  hostingCost: number;
  maintenanceCost: number;
  totalCost: number;
}

export interface PricingComparison {
  resendCost: number | null;
  freeResendCost: number;
  freeResendBreakdown: SelfHostedBreakdown;
  hostedCost: number;
  savingsAbs: number | null;
  savingsPct: number | null;
  hostedSavingsAbs: number | null;
  hostedSavingsPct: number | null;
  resendPlan: string;
  resendNote?: string;
  hostedTier: HostedPricingTier;
}

/**
 * Resend pricing tiers based on monthly email volume
 * Using step pricing - you pay the tier rate for your total volume
 */
const RESEND_TIERS = [
  { min: 0, max: 3000, cost: 0, plan: "Free" },
  { min: 3001, max: 50000, cost: 20, plan: "Pro" },
  { min: 50001, max: 100000, cost: 35, plan: "Business" },
  { min: 100001, max: 200000, cost: 160, plan: "Scale" },
  { min: 200001, max: 500000, cost: 350, plan: "Enterprise" },
  { min: 500001, max: 1000000, cost: 650, plan: "Enterprise+" },
  { min: 1000001, max: 1500000, cost: 825, plan: "Enterprise++" },
  { min: 1500001, max: 2500000, cost: 1050, plan: "Enterprise Max" }
];

/**
 * FreeResend hosted version pricing - simple flat fee model
 * Users pay SES costs directly to Amazon, we only charge service fee
 */
export const HOSTED_PRICING_TIERS: HostedPricingTier[] = [
  {
    name: "Hosted",
    monthlyFee: 0, // Free for first 3000 emails
    includedEmails: 3000,
    overageRate: 15, // $15 flat fee after 3000 emails (not per 1000)
    features: [
      "First 3,000 emails free",
      "$15/month flat fee after 3,000 emails",
      "Use your own SES keys",
      "Managed infrastructure",
      "Email analytics",
      "99.9% uptime SLA"
    ],
    recommended: true
  }
];

/**
 * Calculate Resend cost for given email volume
 * @param volume Monthly email volume (0 to 5,000,000)
 * @returns ResendQuote with cost, plan name, and optional note
 */
export function getResendCost(volume: number): ResendQuote {
  // Clamp volume to valid range
  volume = Math.max(0, Math.min(volume, 5000000));

  // Check if volume exceeds maximum tier
  if (volume > 2500000) {
    return {
      cost: null,
      plan: "Contact Sales",
      note: "Custom pricing for volumes over 2.5M emails/month"
    };
  }

  // Find matching tier
  const tier = RESEND_TIERS.find(tier => volume >= tier.min && volume <= tier.max);
  
  if (!tier) {
    throw new Error(`No pricing tier found for volume: ${volume}`);
  }

  return {
    cost: tier.cost,
    plan: tier.plan,
    note: volume === 0 ? "Free tier includes up to 3,000 emails" : undefined
  };
}

/**
 * Calculate FreeResend self-hosted cost with full breakdown including hosting and maintenance
 * @param volume Monthly email volume
 * @param flatFee Monthly flat fee (default: $0.00 - no platform fee for open source)
 * @param sesRate Cost per 1,000 emails via SES (default: $0.10)
 * @param hostingCost Monthly hosting cost (default: $15.00)
 * @param maintenanceCost Monthly maintenance cost (default: $10.00)
 * @returns Detailed cost breakdown
 */
export function getFreeResendCostBreakdown(
  volume: number, 
  flatFee: number = 0.00, 
  sesRate: number = 0.10,
  hostingCost: number = 15.00,
  maintenanceCost: number = 10.00
): SelfHostedBreakdown {
  // Clamp volume to valid range
  volume = Math.max(0, Math.min(volume, 5000000));
  
  // Ensure positive pricing parameters
  flatFee = Math.max(0, flatFee);
  sesRate = Math.max(0, sesRate);
  hostingCost = Math.max(0, hostingCost);
  maintenanceCost = Math.max(0, maintenanceCost);

  // Calculate individual costs
  const sesCost = (volume / 1000) * sesRate;
  const totalCost = flatFee + sesCost + hostingCost + maintenanceCost;
  
  return {
    sesCost: Math.round(sesCost * 100) / 100,
    flatFee,
    hostingCost,
    maintenanceCost,
    totalCost: Math.round(totalCost * 100) / 100
  };
}

/**
 * Calculate FreeResend cost using flat fee + SES pricing (legacy function for backward compatibility)
 * @param volume Monthly email volume
 * @param flatFee Monthly flat fee (default: $0.00 - no platform fee for open source)
 * @param sesRate Cost per 1,000 emails via SES (default: $0.10)
 * @returns Total monthly cost
 */
export function getFreeResendCost(
  volume: number, 
  flatFee: number = 0.00, 
  sesRate: number = 0.10
): number {
  const breakdown = getFreeResendCostBreakdown(volume, flatFee, sesRate);
  return breakdown.totalCost;
}

/**
 * Get the hosted pricing tier (there's only one)
 * @param volume Monthly email volume
 * @returns The single hosted tier
 */
export function getBestHostedTier(volume: number): HostedPricingTier {
  return HOSTED_PRICING_TIERS[0];
}

/**
 * Calculate hosted version cost for a specific tier
 * @param volume Monthly email volume
 * @param tier Pricing tier to use
 * @returns Detailed cost breakdown
 */
export function getHostedCost(volume: number, tier: HostedPricingTier): HostedQuote {
  // Clamp volume to valid range
  volume = Math.max(0, Math.min(volume, 5000000));

  // Simple pricing: Free for first 3000 emails, $15 flat fee after that
  const serviceFee = volume <= tier.includedEmails ? 0 : 15;
  
  // Note: SES costs are paid directly by user to Amazon, not included here
  const overageEmails = Math.max(0, volume - tier.includedEmails);

  return {
    cost: serviceFee,
    tier,
    breakdown: {
      baseFee: volume <= tier.includedEmails ? 0 : 15,
      overageEmails,
      overageCost: 0 // No overage cost, just flat fee
    }
  };
}

/**
 * Calculate hosted version cost using best tier for volume
 * @param volume Monthly email volume
 * @returns Cost using optimal tier
 */
export function getFreeResendHostedCost(volume: number): HostedQuote {
  const bestTier = getBestHostedTier(volume);
  return getHostedCost(volume, bestTier);
}

/**
 * Compare pricing between Resend, FreeResend self-hosted, and FreeResend hosted
 * @param volume Monthly email volume
 * @param flatFee FreeResend self-hosted flat fee (default: $0.00 - no platform fee for open source)
 * @param sesRate SES rate per 1,000 emails
 * @param hostingCost Monthly hosting cost (default: $15.00)
 * @param maintenanceCost Monthly maintenance cost (default: $10.00)
 * @returns Complete pricing comparison
 */
export function comparePricing(
  volume: number,
  flatFee: number = 0.00,
  sesRate: number = 0.10,
  hostingCost: number = 15.00,
  maintenanceCost: number = 10.00
): PricingComparison {
  const resendQuote = getResendCost(volume);
  const freeResendBreakdown = getFreeResendCostBreakdown(volume, flatFee, sesRate, hostingCost, maintenanceCost);
  const hostedQuote = getFreeResendHostedCost(volume);
  
  // Hosted total cost = service fee + SES costs (user pays SES directly to Amazon)
  const sesCost = (volume / 1000) * sesRate;
  const hostedTotalCost = hostedQuote.cost + sesCost;

  let savingsAbs: number | null = null;
  let savingsPct: number | null = null;
  let hostedSavingsAbs: number | null = null;
  let hostedSavingsPct: number | null = null;

  // Calculate savings only if Resend has a valid cost
  if (resendQuote.cost !== null && resendQuote.cost > 0) {
    // Self-hosted savings vs Resend
    savingsAbs = resendQuote.cost - freeResendBreakdown.totalCost;
    savingsPct = (savingsAbs / resendQuote.cost) * 100;

    // Hosted savings vs Resend (including SES costs)
    hostedSavingsAbs = resendQuote.cost - hostedTotalCost;
    hostedSavingsPct = (hostedSavingsAbs / resendQuote.cost) * 100;
  }

  return {
    resendCost: resendQuote.cost,
    freeResendCost: freeResendBreakdown.totalCost,
    freeResendBreakdown,
    hostedCost: Math.round(hostedTotalCost * 100) / 100,
    savingsAbs,
    savingsPct,
    hostedSavingsAbs,
    hostedSavingsPct,
    resendPlan: resendQuote.plan,
    resendNote: resendQuote.note,
    hostedTier: hostedQuote.tier
  };
}

/**
 * Format number as USD currency with proper separators
 * @param amount Dollar amount
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage with one decimal place
 * @param percent Percentage value
 * @returns Formatted string (e.g., "84.3%")
 */
export function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

/**
 * Clamp number to valid email volume range
 * @param value Input value
 * @returns Clamped value between 0 and 5,000,000
 */
export function clampVolume(value: number): number {
  return Math.max(0, Math.min(value, 5000000));
}

/**
 * Embeddable function for marketing pages and external calculators
 * @param params Pricing parameters
 * @returns Simplified pricing comparison object
 */
export function calculateSavings(params: {
  volume: number;
  flatFee?: number;
  sesRate?: number;
}) {
  const comparison = comparePricing(
    params.volume,
    params.flatFee ?? 0.00,
    params.sesRate ?? 0.10
  );

  return {
    resendCost: comparison.resendCost,
    freeResendCost: comparison.freeResendCost,
    hostedCost: comparison.hostedCost,
    savingsAbs: comparison.savingsAbs,
    savingsPct: comparison.savingsPct,
    hostedSavingsAbs: comparison.hostedSavingsAbs,
    hostedSavingsPct: comparison.hostedSavingsPct
  };
}