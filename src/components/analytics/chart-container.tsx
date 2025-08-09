'use client';

import { useState } from 'react';
import { ChartDataPoint } from '@/types';
import { LineChart } from './charts/line-chart';
import { BarChart } from './charts/bar-chart';
import { AreaChart } from './charts/area-chart';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  showComparison?: boolean;
  height?: number;
}

export function ChartContainer({
  title,
  subtitle,
  data,
  type,
  color,
  showComparison = false,
  height = 300
}: ChartContainerProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  const renderChart = () => {
    const commonProps = {
      data,
      color,
      height
    };

    switch (type) {
      case 'line':
        return <LineChart {...commonProps} />;
      case 'bar':
        return <BarChart {...commonProps} />;
      case 'area':
        return <AreaChart {...commonProps} />;
      default:
        return <LineChart {...commonProps} />;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {showComparison && (
          <div className="flex space-x-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All time</option>
              <option value="30d">Last 30 days</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        {renderChart()}
      </div>

      {/* Chart Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full bg-${color}-500 mr-2`}></div>
          <span>Current Period</span>
        </div>
        {showComparison && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
            <span>Previous Period</span>
          </div>
        )}
      </div>
    </div>
  );
}