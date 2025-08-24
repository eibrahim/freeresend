"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Mail, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface WaitlistSignupProps {
  estimatedVolume?: number;
  onSuccess?: () => void;
  compact?: boolean;
  className?: string;
  trackingContext?: string; // For analytics tracking
}

interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface FormData {
  email: string;
  estimatedVolume?: number;
  currentProvider?: string;
  referralSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    created_at: string;
  };
}

interface FormState {
  email: string;
  volume: string | number;
  currentProvider: string;
  loading: boolean;
  submitted: boolean;
  error: string;
  emailError: string;
  retryCount: number;
  optimisticSubmit: boolean;
}

// Utility function to capture UTM parameters from URL
const captureUTMParams = (): UTMParams => {
  if (typeof window === "undefined") return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utmSource: urlParams.get("utm_source") || undefined,
    utmMedium: urlParams.get("utm_medium") || undefined,
    utmCampaign: urlParams.get("utm_campaign") || undefined,
  };
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistSignup({
  estimatedVolume,
  onSuccess,
  compact = false,
  className = "",
  trackingContext = "unknown",
}: WaitlistSignupProps) {
  // Consolidated state management
  const [formState, setFormState] = useState<FormState>({
    email: "",
    volume: estimatedVolume || "",
    currentProvider: "",
    loading: false,
    submitted: false,
    error: "",
    emailError: "",
    retryCount: 0,
    optimisticSubmit: false,
  });
  
  const [utmParams, setUtmParams] = useState<UTMParams>({});

  // Analytics tracking function
  const trackEvent = useCallback((eventName: string, properties: Record<string, unknown> = {}) => {
    // Track form interactions for analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        ...utmParams,
      });
    }
    
    // Console log for development
    if (process.env.NODE_ENV === "development") {
      console.log("Analytics Event:", eventName, properties);
    }
  }, [utmParams]);

  // Capture UTM parameters on mount
  useEffect(() => {
    setUtmParams(captureUTMParams());
    
    // Track form view for analytics
    trackEvent("waitlist_form_viewed", {
      context: trackingContext,
      has_estimated_volume: !!estimatedVolume,
      compact_mode: compact,
    });
  }, [trackingContext, estimatedVolume, compact, trackEvent]);

  // Real-time email validation with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formState.email && !EMAIL_REGEX.test(formState.email)) {
        setFormState(prev => ({
          ...prev,
          emailError: "Please enter a valid email address"
        }));
      } else {
        setFormState(prev => ({
          ...prev,
          emailError: ""
        }));
      }
    }, 300); // Debounce validation

    return () => clearTimeout(timeoutId);
  }, [formState.email]);

  // Optimistic UI update
  const handleOptimisticUpdate = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      optimisticSubmit: true,
      loading: true,
      error: "",
    }));

    // Track optimistic submission
    trackEvent("waitlist_form_submitted_optimistic", {
      context: trackingContext,
      email_domain: formState.email.split("@")[1],
      has_volume: !!formState.volume,
      has_provider: !!formState.currentProvider,
    });
  }, [trackingContext, formState.email, formState.volume, formState.currentProvider, trackEvent]);

  // Error recovery with retry logic
  const handleRetry = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      error: "",
      loading: false,
      optimisticSubmit: false,
      retryCount: prev.retryCount + 1,
    }));

    trackEvent("waitlist_form_retry", {
      context: trackingContext,
      retry_count: formState.retryCount + 1,
    });
  }, [trackingContext, formState.retryCount, trackEvent]);

  // Enhanced form submission with optimistic updates and error recovery
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormState(prev => ({
      ...prev,
      error: "",
      emailError: "",
    }));

    // Validate email
    if (!formState.email) {
      setFormState(prev => ({
        ...prev,
        emailError: "Email is required"
      }));
      trackEvent("waitlist_form_validation_error", {
        context: trackingContext,
        error_type: "email_required",
      });
      return;
    }

    if (!EMAIL_REGEX.test(formState.email)) {
      setFormState(prev => ({
        ...prev,
        emailError: "Please enter a valid email address"
      }));
      trackEvent("waitlist_form_validation_error", {
        context: trackingContext,
        error_type: "email_invalid",
      });
      return;
    }

    // Start optimistic update
    handleOptimisticUpdate();

    try {
      // Prepare form data
      const formData: FormData = {
        email: formState.email.trim(),
        estimatedVolume: formState.volume ? parseInt(formState.volume.toString(), 10) : undefined,
        currentProvider: formState.currentProvider.trim() || undefined,
        referralSource: (typeof document !== "undefined" ? document.referrer : "") || undefined,
        ...utmParams,
      };

      // Submit to API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to join waitlist");
      }

      // Success - update state
      setFormState(prev => ({
        ...prev,
        submitted: true,
        loading: false,
        optimisticSubmit: false,
      }));

      // Track successful submission
      trackEvent("waitlist_form_submitted_success", {
        context: trackingContext,
        email_domain: formState.email.split("@")[1],
        has_volume: !!formState.volume,
        has_provider: !!formState.currentProvider,
        retry_count: formState.retryCount,
        signup_id: result.data?.id,
      });

      onSuccess?.();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; name?: string };
      let errorMessage = "Failed to join waitlist. Please try again.";
      let errorType = "unknown";

      if (errorObj.name === "AbortError") {
        errorMessage = "Request timed out. Please check your connection and try again.";
        errorType = "timeout";
      } else if (errorObj.message?.includes("409")) {
        errorMessage = "This email is already on our waitlist.";
        errorType = "duplicate";
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
        errorType = "api_error";
      } else {
        errorType = "network_error";
      }

      setFormState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        optimisticSubmit: false,
      }));

      // Track submission error
      trackEvent("waitlist_form_submitted_error", {
        context: trackingContext,
        error_type: errorType,
        error_message: errorMessage,
        retry_count: formState.retryCount,
      });
    }
  };

  // Success state with enhanced messaging
  if (formState.submitted) {
    return (
      <div className={`${compact ? "p-4" : "p-6"} ${className}`}>
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            You&apos;re on the waitlist!
          </h3>
          <p className="text-gray-600 mb-4">
            We&apos;ll notify you when the hosted version becomes available.
          </p>
          {formState.volume && (
            <p className="text-sm text-gray-500">
              Expected volume: {parseInt(formState.volume.toString()).toLocaleString()} emails/month
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? "p-4" : "p-6"} ${className}`}>
      {!compact && (
        <div className="text-center mb-6">
          <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Join the Waitlist
          </h3>
          <p className="text-gray-600">
            Be the first to know when our hosted version launches
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input with enhanced state management */}
        <div>
          <label htmlFor="waitlist-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            id="waitlist-email"
            type="email"
            value={formState.email}
            onChange={(e) => {
              setFormState(prev => ({ ...prev, email: e.target.value }));
              trackEvent("waitlist_form_email_input", {
                context: trackingContext,
                has_value: !!e.target.value,
              });
            }}
            onBlur={() => {
              trackEvent("waitlist_form_email_blur", {
                context: trackingContext,
                email_domain: formState.email.split("@")[1] || "",
                is_valid: EMAIL_REGEX.test(formState.email),
              });
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              formState.emailError ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="your@email.com"
            required
            disabled={formState.loading}
            aria-describedby={formState.emailError ? "email-error" : undefined}
          />
          {formState.emailError && (
            <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {formState.emailError}
            </p>
          )}
        </div>

        {/* Volume Input with analytics tracking */}
        <div>
          <label htmlFor="waitlist-volume" className="block text-sm font-medium text-gray-700 mb-1">
            Expected Monthly Email Volume (optional)
          </label>
          <input
            id="waitlist-volume"
            type="number"
            value={formState.volume}
            onChange={(e) => {
              setFormState(prev => ({ ...prev, volume: e.target.value }));
              trackEvent("waitlist_form_volume_input", {
                context: trackingContext,
                volume: parseInt(e.target.value) || 0,
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., 50000"
            min="0"
            disabled={formState.loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Help us understand your needs better
          </p>
        </div>

        {/* Current Provider Input with tracking */}
        {!compact && (
          <div>
            <label htmlFor="waitlist-provider" className="block text-sm font-medium text-gray-700 mb-1">
              Current Email Provider (optional)
            </label>
            <input
              id="waitlist-provider"
              type="text"
              value={formState.currentProvider}
              onChange={(e) => {
                setFormState(prev => ({ ...prev, currentProvider: e.target.value }));
                trackEvent("waitlist_form_provider_input", {
                  context: trackingContext,
                  provider: e.target.value.toLowerCase(),
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Resend, SendGrid, Mailgun"
              maxLength={100}
              disabled={formState.loading}
            />
          </div>
        )}

        {/* Enhanced Error Message with Retry */}
        {formState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-600 mb-2">
                  {formState.error}
                </p>
                {formState.retryCount < 3 && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-xs text-red-700 hover:text-red-800 underline flex items-center"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Submit Button with Optimistic UI */}
        <button
          type="submit"
          disabled={formState.loading || !!formState.emailError || !formState.email}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          onClick={() => {
            trackEvent("waitlist_form_submit_clicked", {
              context: trackingContext,
              has_email: !!formState.email,
              has_volume: !!formState.volume,
              has_provider: !!formState.currentProvider,
            });
          }}
        >
          {formState.loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {formState.optimisticSubmit ? "Joining..." : "Submitting..."}
            </>
          ) : (
            "Join Waitlist"
          )}
        </button>
      </form>

      {/* Privacy Note */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        We&apos;ll only use your email to notify you about the hosted version launch.
        No spam, unsubscribe anytime.
      </p>
    </div>
  );
}