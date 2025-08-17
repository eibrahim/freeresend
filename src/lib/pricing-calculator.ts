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

export interface PricingComparison {
  resendCost: number | null;
  freeResendCost: number;
  savingsAbs: number | null;
  savingsPct: number | null;
  resendPlan: string;
  resendNote?: string;
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
 * Calculate FreeResend cost using flat fee + SES pricing
 * @param volume Monthly email volume
 * @param flatFee Monthly flat fee (default: $5.00)
 * @param sesRate Cost per 1,000 emails via SES (default: $0.10)
 * @returns Total monthly cost
 */
export function getFreeResendCost(
  volume: number, 
  flatFee: number = 5.00, 
  sesRate: number = 0.10
): number {
  // Clamp volume to valid range
  volume = Math.max(0, Math.min(volume, 5000000));
  
  // Ensure positive pricing parameters
  flatFee = Math.max(0, flatFee);
  sesRate = Math.max(0, sesRate);

  // Linear SES pricing: flatFee + (volume / 1000) * sesRate
  const sesCost = (volume / 1000) * sesRate;
  const totalCost = flatFee + sesCost;
  
  // Round to avoid floating point precision issues
  return Math.round(totalCost * 100) / 100;
}

/**
 * Compare pricing between Resend and FreeResend
 * @param volume Monthly email volume
 * @param flatFee FreeResend flat fee
 * @param sesRate SES rate per 1,000 emails
 * @returns Complete pricing comparison
 */
export function comparePricing(
  volume: number,
  flatFee: number = 5.00,
  sesRate: number = 0.10
): PricingComparison {
  const resendQuote = getResendCost(volume);
  const freeResendCost = getFreeResendCost(volume, flatFee, sesRate);

  let savingsAbs: number | null = null;
  let savingsPct: number | null = null;

  // Calculate savings only if Resend has a valid cost
  if (resendQuote.cost !== null && resendQuote.cost > 0) {
    savingsAbs = resendQuote.cost - freeResendCost;
    savingsPct = (savingsAbs / resendQuote.cost) * 100;
  }

  return {
    resendCost: resendQuote.cost,
    freeResendCost,
    savingsAbs,
    savingsPct,
    resendPlan: resendQuote.plan,
    resendNote: resendQuote.note
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
    params.flatFee ?? 5.00,
    params.sesRate ?? 0.10
  );

  return {
    resendCost: comparison.resendCost,
    freeResendCost: comparison.freeResendCost,
    savingsAbs: comparison.savingsAbs,
    savingsPct: comparison.savingsPct
  };
}