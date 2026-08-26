"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import MetricCard from "./MetricCard";
import TimeSeriesChart from "./TimeSeriesChart";
import DateRangePicker from "./DateRangePicker";
import { Mail, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { subDays } from "date-fns";

interface AnalyticsData {
  metrics: {
    totalEmails: number;
    deliveryRate: number;
    bounceRate: number;
    avgDailyVolume: number;
  };
  statusBreakdown: {
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
    complained: number;
    pending: number;
  };
  timeSeries: Array<{
    date: string;
    total: number;
    delivered: number;
    bounced: number;
    failed: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );

  // Default to last 30 days
  const getDefaultDateRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = subDays(end, 29);
    start.setHours(0, 0, 0, 0);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      console.error("Failed to load analytics:", error);
      setError(errorObj.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleDateRangeChange = (newRange: {
    startDate: string;
    endDate: string;
  }) => {
    setDateRange(newRange);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            Email Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor your email performance and delivery metrics over time.
          </p>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white shadow rounded-lg p-4">
        <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Emails"
          value={
            loading
              ? "..."
              : formatNumber(analyticsData?.metrics.totalEmails || 0)
          }
          subtitle={
            !loading && analyticsData
              ? `${analyticsData.dateRange.startDate} - ${analyticsData.dateRange.endDate}`
              : undefined
          }
          icon={<Mail className="h-6 w-6" />}
          loading={loading}
        />

        <MetricCard
          title="Delivery Rate"
          value={
            loading
              ? "..."
              : `${analyticsData?.metrics.deliveryRate.toFixed(1) || 0}%`
          }
          subtitle={
            !loading && analyticsData
              ? `${analyticsData.statusBreakdown.delivered} delivered`
              : undefined
          }
          icon={<CheckCircle className="h-6 w-6" />}
          loading={loading}
        />

        <MetricCard
          title="Bounce Rate"
          value={
            loading
              ? "..."
              : `${analyticsData?.metrics.bounceRate.toFixed(1) || 0}%`
          }
          subtitle={
            !loading && analyticsData
              ? `${analyticsData.statusBreakdown.bounced} bounced`
              : undefined
          }
          icon={<XCircle className="h-6 w-6" />}
          loading={loading}
        />

        <MetricCard
          title="Avg. Daily Volume"
          value={
            loading
              ? "..."
              : formatNumber(
                  Math.round(analyticsData?.metrics.avgDailyVolume || 0)
                )
          }
          subtitle={!loading ? "emails per day" : undefined}
          icon={<TrendingUp className="h-6 w-6" />}
          loading={loading}
        />
      </div>

      {/* Time Series Chart */}
      <TimeSeriesChart
        data={analyticsData?.timeSeries || []}
        loading={loading}
      />

      {/* Status Breakdown Table */}
      {!loading && analyticsData && analyticsData.metrics.totalEmails > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Status Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analyticsData.statusBreakdown)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => {
                    const percentage = (
                      (count / analyticsData.metrics.totalEmails) *
                      100
                    ).toFixed(1);
                    const statusColors: Record<string, string> = {
                      delivered: "text-green-600",
                      sent: "text-blue-600",
                      bounced: "text-red-600",
                      failed: "text-red-600",
                      complained: "text-red-600",
                      pending: "text-yellow-600",
                    };

                    return (
                      <tr key={status}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count.toLocaleString()}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            statusColors[status] || "text-gray-900"
                          }`}
                        >
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
