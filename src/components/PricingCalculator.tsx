"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Calculator, DollarSign, TrendingDown } from 'lucide-react';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
import {
  comparePricing,
  formatUSD,
  formatPercent,
  clampVolume,
  type PricingComparison
} from '../lib/pricing-calculator';
import WaitlistSignup from './WaitlistSignup';

interface PricingCalculatorProps {
  className?: string;
  showAdvanced?: boolean;
  embeddable?: boolean;
  showWaitlist?: boolean;
}

const QUICK_PICK_VALUES = [
  { label: '3K', value: 3000 },
  { label: '4K', value: 4000 },
  { label: '5K', value: 5000 },
  { label: '10K', value: 10000 },
  { label: '20K', value: 20000 },
  { label: '30K', value: 30000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '200K', value: 200000 },
  { label: '500K', value: 500000 },
  { label: '1M', value: 1000000 },
];

const STORAGE_KEYS = {
  VOLUME: 'pricing-calculator-volume',
  FLAT_FEE: 'pricing-calculator-flat-fee',
  SES_RATE: 'pricing-calculator-ses-rate',
  HOSTING_COST: 'pricing-calculator-hosting-cost',
  MAINTENANCE_COST: 'pricing-calculator-maintenance-cost',
} as const;

export default function PricingCalculator({
  className = '',
  showAdvanced = true,
  embeddable = false,
  showWaitlist = true
}: PricingCalculatorProps) {
  // State with localStorage persistence
  const [volume, setVolume] = useState(50000);
  const [flatFee, setFlatFee] = useState(0.00);
  const [sesRate, setSesRate] = useState(0.10);
  const [hostingCost, setHostingCost] = useState(15.00);
  const [maintenanceCost, setMaintenanceCost] = useState(10.00);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
      const savedFlatFee = localStorage.getItem(STORAGE_KEYS.FLAT_FEE);
      const savedSesRate = localStorage.getItem(STORAGE_KEYS.SES_RATE);
      const savedHostingCost = localStorage.getItem(STORAGE_KEYS.HOSTING_COST);
      const savedMaintenanceCost = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_COST);

      if (savedVolume) setVolume(parseInt(savedVolume, 10));
      
      // Migration: Reset old platform fee values to 0 (open source, no platform fee)
      if (savedFlatFee) {
        const flatFeeValue = parseFloat(savedFlatFee);
        // If it's any of the old default values, reset to $0.00
        if (flatFeeValue === 5.00 || flatFeeValue === 9.00) {
          setFlatFee(0.00);
          // Update localStorage immediately to prevent showing old value
          localStorage.setItem(STORAGE_KEYS.FLAT_FEE, '0.00');
        } else {
          setFlatFee(flatFeeValue);
        }
      }
      
      if (savedSesRate) setSesRate(parseFloat(savedSesRate));
      if (savedHostingCost) setHostingCost(parseFloat(savedHostingCost));
      if (savedMaintenanceCost) setMaintenanceCost(parseFloat(savedMaintenanceCost));

      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
      localStorage.setItem(STORAGE_KEYS.FLAT_FEE, flatFee.toString());
      localStorage.setItem(STORAGE_KEYS.SES_RATE, sesRate.toString());
      localStorage.setItem(STORAGE_KEYS.HOSTING_COST, hostingCost.toString());
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE_COST, maintenanceCost.toString());
    }
  }, [volume, flatFee, sesRate, hostingCost, maintenanceCost, isLoaded]);

  // Calculate pricing comparison
  const comparison = useMemo<PricingComparison>(() => {
    return comparePricing(volume, flatFee, sesRate, hostingCost, maintenanceCost);
  }, [volume, flatFee, sesRate, hostingCost, maintenanceCost]);

  // Handle volume input changes with validation
  const handleVolumeChange = (newVolume: number | string) => {
    const numValue = typeof newVolume === 'string' ? parseInt(newVolume, 10) || 0 : newVolume;
    setVolume(clampVolume(numValue));
  };

  // Handle flat fee changes with validation
  const handleFlatFeeChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFlatFee(Math.max(0, numValue));
  };

  // Handle SES rate changes with validation
  const handleSesRateChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setSesRate(Math.max(0, numValue));
  };

  // Handle hosting cost changes with validation
  const handleHostingCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setHostingCost(Math.max(0, numValue));
  };

  // Handle maintenance cost changes with validation
  const handleMaintenanceCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setMaintenanceCost(Math.max(0, numValue));
  };

  // Format volume for display
  const formatVolume = (vol: number): string => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  // Calculate best savings option
  const bestSavings = useMemo(() => {
    if (comparison.resendCost === null || comparison.resendCost === 0) {
      return { amount: null, percentage: null, option: 'none', color: 'text-gray-500' };
    }

    const selfHostedSavings = comparison.savingsAbs || 0;
    const hostedSavings = comparison.hostedSavingsAbs || 0;

    if (selfHostedSavings > hostedSavings && selfHostedSavings > 0) {
      return {
        amount: selfHostedSavings,
        percentage: comparison.savingsPct,
        option: 'self-hosted',
        color: 'text-green-600'
      };
    } else if (hostedSavings > selfHostedSavings && hostedSavings > 0) {
      return {
        amount: hostedSavings,
        percentage: comparison.hostedSavingsPct,
        option: 'hosted',
        color: 'text-green-600'
      };
    } else if (Math.max(selfHostedSavings, hostedSavings) > 0) {
      // If they're equal but positive, prefer hosted for simplicity
      return {
        amount: hostedSavings,
        percentage: comparison.hostedSavingsPct,
        option: 'hosted',
        color: 'text-green-600'
      };
    } else {
      return { amount: null, percentage: null, option: 'none', color: 'text-gray-500' };
    }
  }, [comparison]);

  // Legacy variables for backward compatibility
  const hasSavings = bestSavings.amount !== null && bestSavings.amount > 0;
  const savingsColor = bestSavings.color;

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 ${className}`}>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="space-y-6">
          {/* Volume Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Monthly Email Volume
            </label>

            {/* Numeric Input */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="number"
                  value={volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="5000000"
                  step="1000"
                  aria-label="Monthly email volume"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  emails
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {formatVolume(volume)} emails/month
              </div>
            </div>

            {/* Range Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="2500000"
                step="1000"
                value={Math.min(volume, 2500000)}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                aria-label="Volume slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>1.25M</span>
                <span>2.5M</span>
              </div>
            </div>

            {/* Quick Pick Buttons */}
            <div className="flex flex-wrap gap-2">
              {QUICK_PICK_VALUES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => handleVolumeChange(value)}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${volume === value
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  aria-label={`Set volume to ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  FreeResend Pricing Parameters
                </h3>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  aria-expanded={showDetails}
                >
                  <Settings className="h-4 w-4" />
                  <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Flat Fee Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </div>
                    <input
                      type="number"
                      value={flatFee.toFixed(2)}
                      onChange={(e) => handleFlatFeeChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.50"
                      aria-label="Optional platform fee in USD"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    $0 for open source self-hosting
                  </div>
                </div>

                {/* SES Rate Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SES Rate per 1,000 emails
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </div>
                    <input
                      type="number"
                      value={sesRate.toFixed(2)}
                      onChange={(e) => handleSesRateChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      aria-label="SES rate per 1000 emails in USD"
                    />
                  </div>
                </div>

                {/* Hosting Cost Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hosting Cost
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </div>
                    <input
                      type="number"
                      value={hostingCost.toFixed(2)}
                      onChange={(e) => handleHostingCostChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="1.00"
                      aria-label="Monthly hosting cost in USD"
                    />
                  </div>
                </div>

                {/* Maintenance Cost Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Cost
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </div>
                    <input
                      type="number"
                      value={maintenanceCost.toFixed(2)}
                      onChange={(e) => handleMaintenanceCostChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="1.00"
                      aria-label="Monthly maintenance cost in USD"
                    />
                  </div>
                </div>
              </div>

              {/* Formula Details */}
              {showDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Self-Hosted Cost Breakdown:
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {comparison.freeResendBreakdown.flatFee > 0 && (
                      <div className="flex justify-between">
                        <span>Monthly platform fee:</span>
                        <span className="font-mono">{formatUSD(comparison.freeResendBreakdown.flatFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>SES costs ({formatVolume(volume)} emails):</span>
                      <span className="font-mono">{formatUSD(comparison.freeResendBreakdown.sesCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hosting (VPS/Database):</span>
                      <span className="font-mono">{formatUSD(comparison.freeResendBreakdown.hostingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maintenance (DevOps/Updates):</span>
                      <span className="font-mono">{formatUSD(comparison.freeResendBreakdown.maintenanceCost)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between font-medium">
                      <span>Total monthly cost:</span>
                      <span className="font-mono text-blue-600">{formatUSD(comparison.freeResendBreakdown.totalCost)}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-blue-700">
                      <strong>Real-world costs included:</strong> This calculation includes realistic hosting costs (VPS + managed database)
                      and maintenance time (security updates, monitoring, backups). Many &quot;cost calculators&quot; only show
                      the raw SES fees, which is misleading for production deployments.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        {/* Resend Cost */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resend</h3>
          </div>

          <div className="mb-2">
            {comparison.resendCost !== null ? (
              <span className="text-3xl font-bold text-gray-900">
                {formatUSD(comparison.resendCost)}
              </span>
            ) : (
              <span className="text-2xl font-bold text-gray-500">
                Contact Sales
              </span>
            )}
          </div>

          <div className="text-sm text-gray-500">
            {comparison.resendPlan}
            {comparison.resendNote && (
              <div className="mt-1 text-xs">{comparison.resendNote}</div>
            )}
            {comparison.resendCost === 0 && (
              <div className="mt-1 text-xs text-blue-600">
                Free at this volume
              </div>
            )}
          </div>
        </div>

        {/* FreeResend Self-Hosted Cost */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Self-Hosted</h3>
          </div>

          <div className="mb-2">
            <span className="text-3xl font-bold text-blue-600">
              {formatUSD(comparison.freeResendCost)}
            </span>
          </div>

          <div className="text-sm text-gray-500">
            <div>Includes hosting & maintenance</div>
            <div className="text-xs mt-1 space-y-0.5">
              <div>• SES: {formatUSD(comparison.freeResendBreakdown.sesCost)}</div>
              <div>• Infrastructure: {formatUSD(comparison.freeResendBreakdown.hostingCost + comparison.freeResendBreakdown.maintenanceCost)}</div>
              {comparison.freeResendBreakdown.flatFee > 0 && (
                <div>• Platform: {formatUSD(comparison.freeResendBreakdown.flatFee)}</div>
              )}
            </div>
            {comparison.savingsAbs !== null && comparison.savingsAbs > 0 && (
              <div className="mt-2 text-xs text-green-600 font-medium">
                Save {formatPercent(comparison.savingsPct!)} vs Resend
              </div>
            )}
            {comparison.savingsAbs !== null && comparison.savingsAbs <= 0 && (
              <div className="mt-2 text-xs text-orange-600">
                Consider hosted version for better value
              </div>
            )}
          </div>
        </div>

        {/* FreeResend Hosted Cost */}
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${waitlistSuccess ? 'border-green-200 bg-green-50' : 'border-purple-200'}`}>
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`h-5 w-5 rounded flex items-center justify-center ${waitlistSuccess ? 'bg-green-600' : 'bg-purple-600'}`}>
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Hosted</h3>
            </div>
            {waitlistSuccess && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                On Waitlist ✓
              </span>
            )}
            {!waitlistSuccess && comparison.hostedTier.recommended && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Recommended
              </span>
            )}
          </div>

          <div className="mb-2">
            <span className={`text-3xl font-bold ${waitlistSuccess ? 'text-green-600' : 'text-purple-600'}`}>
              {formatUSD(comparison.hostedCost)}
            </span>
          </div>

          <div className="text-sm text-gray-500">
            <div className="mb-1">
              {volume <= 3000 ? (
                <span className="text-green-600 font-medium">Free service + SES costs</span>
              ) : (
                <span>$15 service fee + {formatUSD((volume / 1000) * sesRate)} SES</span>
              )}
            </div>
            {comparison.hostedSavingsAbs !== null && comparison.hostedSavingsAbs > 0 && (
              <div className="mt-1 text-xs text-green-600">
                Save {formatPercent(comparison.hostedSavingsPct!)} vs Resend
              </div>
            )}
            {comparison.hostedSavingsAbs !== null && comparison.hostedSavingsAbs < 0 && (
              <div className="mt-1 text-xs text-orange-600">
                +{formatPercent(Math.abs(comparison.hostedSavingsPct!))} vs Resend
              </div>
            )}
            {showWaitlist && !waitlistSuccess && !embeddable && (
              <button
                onClick={() => {
                  const waitlistSection = document.querySelector('[data-waitlist-signup]');
                  waitlistSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-2 text-xs text-purple-600 hover:text-purple-700 underline"
              >
                Join waitlist →
              </button>
            )}
            {waitlistSuccess && (
              <div className="mt-1 text-xs text-green-600">
                You&apos;re on the waitlist! We&apos;ll notify you when it&apos;s ready.
              </div>
            )}
          </div>
        </div>

        {/* Best Savings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingDown className={`h-5 w-5 ${hasSavings ? 'text-green-600' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-gray-900">Best Savings</h3>
          </div>

          <div className="mb-2">
            {bestSavings.amount !== null ? (
              <span className={`text-3xl font-bold ${bestSavings.color}`}>
                {formatUSD(bestSavings.amount)}
              </span>
            ) : (
              <span className="text-2xl font-bold text-gray-500">N/A</span>
            )}
          </div>

          <div className={`text-sm ${bestSavings.color}`}>
            {bestSavings.percentage !== null && bestSavings.option !== 'none' ? (
              <>
                {formatPercent(bestSavings.percentage)} with {bestSavings.option}
                {hasSavings && (
                  <div className="text-xs mt-1">
                    {formatUSD(bestSavings.amount!)} saved per month
                  </div>
                )}
              </>
            ) : (
              'No savings vs Resend'
            )}
          </div>
        </div>
      </div>

      {/* Self-Hosted Reality Check */}
      {!embeddable && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Self-Hosted: The Real Costs
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">What&apos;s Actually Included</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>VPS Hosting (2-4GB RAM):</span>
                  <span className="font-medium">{formatUSD(hostingCost)}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Managed PostgreSQL:</span>
                  <span className="font-medium">~{formatUSD(hostingCost * 0.6)}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>DevOps & Maintenance:</span>
                  <span className="font-medium">{formatUSD(maintenanceCost)}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Monitoring & Backups:</span>
                  <span className="font-medium">~{formatUSD(5)}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>SSL & Security Updates:</span>
                  <span className="font-medium">Time investment</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-medium text-blue-600">
                  <span>Infrastructure Total:</span>
                  <span>{formatUSD(hostingCost + maintenanceCost)}/month</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Platform Fee (Open Source):</span>
                  <span>FREE</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Hidden Costs to Consider</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Setup Time:</strong> 4-8 hours initial deployment and configuration</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Security Updates:</strong> Monthly patches and dependency updates</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Monitoring:</strong> Setting up alerts, log management, uptime monitoring</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Backup Strategy:</strong> Database backups, disaster recovery planning</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Scaling Issues:</strong> Performance tuning as volume grows</span>
                </li>
              </ul>

              <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                <div className="text-xs text-orange-700">
                  <strong>Reality Check:</strong> Most &quot;self-hosted savings&quot; calculators only show SES costs ({formatUSD(comparison.freeResendBreakdown.sesCost)})
                  and ignore the {formatUSD(hostingCost + maintenanceCost)} in infrastructure and time costs.
                  Our calculator includes realistic production costs.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hosted Tier Details */}
      {!embeddable && (
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-6 w-6 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">H</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Hosted Version: {comparison.hostedTier.name} Tier
            </h3>
            {comparison.hostedTier.recommended && (
              <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                Recommended
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pricing Breakdown</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>First 3,000 emails: <span className="text-green-600 font-medium">Free</span></div>
                <div>After 3,000 emails: <span className="text-purple-600 font-medium">$15/month flat fee</span></div>
                <div>SES costs: <span className="text-blue-600">You pay Amazon directly</span></div>
                {volume > comparison.hostedTier.includedEmails && (
                  <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                    <div className="text-purple-700 font-medium text-sm">
                      Your cost: $15/month service fee + SES costs
                    </div>
                  </div>
                )}
                {volume <= comparison.hostedTier.includedEmails && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <div className="text-green-700 font-medium text-sm">
                      Your cost: Free service fee + SES costs only
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Features</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {comparison.hostedTier.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {showWaitlist && (
            <div className="mt-6 bg-white rounded-lg border border-purple-200 overflow-hidden" data-waitlist-signup>
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <h4 className="text-lg font-semibold text-white">
                  Get Early Access to Hosted Version
                </h4>
                <p className="text-purple-100 text-sm mt-1">
                  Join the waitlist and be the first to know when it launches
                </p>
              </div>
              <WaitlistSignup
                estimatedVolume={volume}
                compact={true}
                className="border-0"
                trackingContext="pricing-calculator"
                onSuccess={() => {
                  setWaitlistSuccess(true);
                  // Track successful signup from pricing calculator
                  if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'waitlist_signup_from_calculator', {
                      volume: volume,
                      tier: comparison.hostedTier.name,
                      hosted_cost: comparison.hostedCost,
                      self_hosted_cost: comparison.freeResendCost,
                      resend_cost: comparison.resendCost
                    });
                  }
                }}
              />
            </div>
          )}

          {!showWaitlist && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600">
                <strong>Coming Soon:</strong> The hosted version is currently in development.
                Join our waitlist to be notified when it becomes available and get early access pricing.
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// Export calculation functions and types for external use
export {
  comparePricing,
  formatUSD,
  formatPercent,
  HOSTED_PRICING_TIERS,
  getBestHostedTier,
  getHostedCost,
  getFreeResendHostedCost
} from '../lib/pricing-calculator';
export type { HostedPricingTier, HostedQuote } from '../lib/pricing-calculator';