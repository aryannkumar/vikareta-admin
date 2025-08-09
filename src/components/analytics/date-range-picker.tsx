'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState(from);
  const [tempTo, setTempTo] = useState(to);

  const handleApply = () => {
    onChange(tempFrom, tempTo);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempFrom(from);
    setTempTo(to);
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
      >
        <Calendar className="h-4 w-4 mr-2" />
        {formatDate(from)} - {formatDate(to)}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Select Date Range</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={tempFrom.toISOString().split('T')[0]}
                  onChange={(e) => setTempFrom(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={tempTo.toISOString().split('T')[0]}
                  onChange={(e) => setTempTo(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Last 7 days', days: 7 },
                  { label: 'Last 30 days', days: 30 },
                  { label: 'Last 90 days', days: 90 },
                  { label: 'Last year', days: 365 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const to = new Date();
                      const from = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000);
                      setTempFrom(from);
                      setTempTo(to);
                    }}
                    className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleCancel}
        />
      )}
    </div>
  );
}