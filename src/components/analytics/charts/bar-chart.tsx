'use client';

import { ChartDataPoint } from '@/types';

interface BarChartProps {
  data: ChartDataPoint[];
  color: string;
  height: number;
}

export function BarChart({ data, color, height }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const width = 600;
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + ratio * chartHeight;
          const value = maxValue - (ratio * maxValue);
          return (
            <g key={index}>
              <line 
                x1={padding - 5} 
                y1={y} 
                x2={padding} 
                y2={y} 
                stroke="#6b7280" 
                strokeWidth="1"
              />
              <text 
                x={padding - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="text-xs fill-gray-500"
              >
                {Math.round(value).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          const x = padding + (index * (chartWidth / data.length)) + (barSpacing / 2);
          const y = height - padding - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                className={`fill-${color}-500 hover:fill-${color}-600 transition-colors`}
                rx="2"
              >
                <title>{`${point.label || point.date}: ${point.value.toLocaleString()}`}</title>
              </rect>
              
              {/* X-axis labels */}
              {index % Math.ceil(data.length / 6) === 0 && (
                <text 
                  x={x + barWidth / 2} 
                  y={height - padding + 20} 
                  textAnchor="middle" 
                  className="text-xs fill-gray-500"
                >
                  {new Date(point.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}