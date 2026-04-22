import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
}: MetricCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-600">{icon}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
