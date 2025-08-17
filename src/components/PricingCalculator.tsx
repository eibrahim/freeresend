"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Calculator, DollarSign, TrendingDown } from 'lucide-react';
import {
  comparePricing,
  formatUSD,
  formatPercent,
  clampVolume,
  type PricingComparison
} from '../lib/pricing-calculator';

interface PricingCalculatorProps {
  className?: string;
  showAdvanced?: boolean;
  embeddable?: boolean;
}

const QUICK_PICK_VALUES = [
  { label: '3K', value: 3000 },
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
} as const;

export default function PricingCalculator({ 
  className = '',
  showAdvanced = true,
  embeddable = false 
}: PricingCalculatorProps) {
  // State with localStorage persistence
  const [volume, setVolume] = useState(50000);
  const [flatFee, setFlatFee] = useState(5.00);
  const [sesRate, setSesRate] = useState(0.10);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
      const savedFlatFee = localStorage.getItem(STORAGE_KEYS.FLAT_FEE);
      const savedSesRate = localStorage.getItem(STORAGE_KEYS.SES_RATE);

      if (savedVolume) setVolume(parseInt(savedVolume, 10));
      if (savedFlatFee) setFlatFee(parseFloat(savedFlatFee));
      if (savedSesRate) setSesRate(parseFloat(savedSesRate));
      
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
      localStorage.setItem(STORAGE_KEYS.FLAT_FEE, flatFee.toString());
      localStorage.setItem(STORAGE_KEYS.SES_RATE, sesRate.toString());
    }
  }, [volume, flatFee, sesRate, isLoaded]);

  // Calculate pricing comparison
  const comparison = useMemo<PricingComparison>(() => {
    return comparePricing(volume, flatFee, sesRate);
  }, [volume, flatFee, sesRate]);

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

  // Format volume for display
  const formatVolume = (vol: number): string => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  // Determine if FreeResend offers savings
  const hasSavings = comparison.savingsAbs !== null && comparison.savingsAbs > 0;
  const savingsColor = hasSavings ? 'text-green-600' : 'text-gray-500';

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
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    volume === value
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

              <div className="grid md:grid-cols-2 gap-4">
                {/* Flat Fee Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Flat Fee
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
                      aria-label="Monthly flat fee in USD"
                    />
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
              </div>

              {/* Formula Details */}
              {showDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Calculation Formula:
                  </h4>
                  <code className="text-sm text-gray-600 block">
                    FreeResend Cost = ${flatFee.toFixed(2)} + ({formatVolume(volume)} ÷ 1,000) × ${sesRate.toFixed(2)}
                  </code>
                  <div className="text-xs text-gray-500 mt-2">
                    SES pricing is linear - no rounding to the next 1,000 emails
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Resend Cost */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resend Cost</h3>
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
                Resend free at this volume
              </div>
            )}
          </div>
        </div>

        {/* FreeResend Cost */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">FreeResend Cost</h3>
          </div>
          
          <div className="mb-2">
            <span className="text-3xl font-bold text-blue-600">
              {formatUSD(comparison.freeResendCost)}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            Flat fee + SES charges
          </div>
        </div>

        {/* Savings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingDown className={`h-5 w-5 ${hasSavings ? 'text-green-600' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-gray-900">Savings</h3>
          </div>
          
          <div className="mb-2">
            {comparison.savingsAbs !== null ? (
              <span className={`text-3xl font-bold ${savingsColor}`}>
                {formatUSD(comparison.savingsAbs)}
              </span>
            ) : (
              <span className="text-2xl font-bold text-gray-500">N/A</span>
            )}
          </div>
          
          <div className={`text-sm ${savingsColor}`}>
            {comparison.savingsPct !== null ? (
              <>
                {formatPercent(comparison.savingsPct)} savings
                {hasSavings && (
                  <div className="text-xs mt-1">
                    {formatUSD(comparison.savingsAbs!)} saved per month
                  </div>
                )}
              </>
            ) : (
              'No comparison available'
            )}
          </div>
        </div>
      </div>
     
    </div>
  );
}

// Export calculation function for external use
export { comparePricing, formatUSD, formatPercent } from '../lib/pricing-calculator';