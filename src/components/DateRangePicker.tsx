"use client";

import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, subDays } from "date-fns";
import "react-day-picker/dist/style.css";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PresetKey = "7days" | "30days" | "90days";

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: value.startDate ? new Date(value.startDate) : undefined,
    to: value.endDate ? new Date(value.endDate) : undefined,
  });

  const presets: Array<{ key: PresetKey; label: string; days: number }> = [
    { key: "7days", label: "Last 7 days", days: 7 },
    { key: "30days", label: "Last 30 days", days: 30 },
    { key: "90days", label: "Last 90 days", days: 90 },
  ];

  const getActivePreset = (): PresetKey | null => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Check if end date is today
    if (end.toDateString() !== today.toDateString()) {
      return null;
    }

    for (const preset of presets) {
      const presetStart = subDays(today, preset.days - 1);
      presetStart.setHours(0, 0, 0, 0);
      
      if (start.toDateString() === presetStart.toDateString()) {
        return preset.key;
      }
    }

    return null;
  };

  const activePreset = getActivePreset();

  const handlePresetClick = (days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = subDays(end, days - 1);
    start.setHours(0, 0, 0, 0);

    onChange({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });

    setShowCustomPicker(false);
  };

  const handleCustomApply = () => {
    if (selectedRange.from && selectedRange.to) {
      const start = new Date(selectedRange.from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedRange.to);
      end.setHours(23, 59, 59, 999);

      onChange({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      });

      setShowCustomPicker(false);
    }
  };

  const handleCustomCancel = () => {
    setSelectedRange({
      from: value.startDate ? new Date(value.startDate) : undefined,
      to: value.endDate ? new Date(value.endDate) : undefined,
    });
    setShowCustomPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Preset buttons */}
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => handlePresetClick(preset.days)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activePreset === preset.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {preset.label}
          </button>
        ))}

        {/* Custom date range button */}
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            showCustomPicker
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Custom Range
        </button>

        {/* Current date range display */}
        {!showCustomPicker && (
          <span className="text-sm text-gray-600 ml-4">
            {format(new Date(value.startDate), "MMM d, yyyy")} -{" "}
            {format(new Date(value.endDate), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {/* Custom date picker dropdown */}
      {showCustomPicker && (
        <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg border border-gray-200 p-4 z-50">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Select Date Range
            </p>
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={(range) =>
                setSelectedRange({
                  from: range?.from,
                  to: range?.to,
                })
              }
              disabled={{ after: new Date() }}
              numberOfMonths={2}
              modifiersClassNames={{
                selected: "bg-blue-600 text-white",
                today: "font-bold",
              }}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleCustomCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomApply}
              disabled={!selectedRange.from || !selectedRange.to}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
