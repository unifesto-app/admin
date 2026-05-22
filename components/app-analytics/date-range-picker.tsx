'use client';

import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  value: { startDate: string; endDate: string };
  onChange: (value: { startDate: string; endDate: string }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const handlePreset = (days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    onChange({ startDate, endDate });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <input
          type="date"
          value={value.startDate}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          className="text-sm border-none focus:outline-none"
        />
        <span className="text-gray-400">-</span>
        <input
          type="date"
          value={value.endDate}
          onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          className="text-sm border-none focus:outline-none"
        />
      </div>

      <div className="flex gap-1">
        {presets.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePreset(preset.days)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
