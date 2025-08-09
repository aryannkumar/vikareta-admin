'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MetricsFilterProps {
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
}

const availableMetrics = [
  { id: 'users', label: 'Users', description: 'User registration and activity metrics' },
  { id: 'orders', label: 'Orders', description: 'Order volume and completion metrics' },
  { id: 'revenue', label: 'Revenue', description: 'Revenue and financial metrics' },
  { id: 'products', label: 'Products', description: 'Product listing and performance metrics' },
  { id: 'engagement', label: 'Engagement', description: 'User engagement and interaction metrics' },
  { id: 'conversion', label: 'Conversion', description: 'Conversion rates and funnel metrics' },
  { id: 'retention', label: 'Retention', description: 'User retention and churn metrics' },
  { id: 'geographic', label: 'Geographic', description: 'Regional and location-based metrics' }
];

export function MetricsFilter({ selectedMetrics, onChange }: MetricsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onChange(selectedMetrics.filter(id => id !== metricId));
    } else {
      onChange([...selectedMetrics, metricId]);
    }
  };

  const handleSelectAll = () => {
    onChange(availableMetrics.map(m => m.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
      >
        {selectedMetrics.length} selected
        <ChevronDown className="h-4 w-4 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-900">Select Metrics</h4>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableMetrics.map((metric) => (
                <label key={metric.id} className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric.id)}
                    onChange={() => handleToggleMetric(metric.id)}
                    className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}