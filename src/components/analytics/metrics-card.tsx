'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

export function MetricsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  subtitle 
}: MetricsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${colorClasses[color]} rounded-md p-3`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {change !== undefined && change !== 0 && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change > 0 ? (
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="ml-1">
                      {Math.abs(change)}%
                    </span>
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}