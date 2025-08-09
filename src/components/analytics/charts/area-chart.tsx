'use client';

import { ChartDataPoint } from '@/types';

interface AreaChartProps {
  data: ChartDataPoint[];
  color: string;
  height: number;
}

export function AreaChart({ data, color, height }: AreaChartProps) {
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
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const width = 600;
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Create path for the area
  const pathPoints = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + ((maxValue - point.value) / range) * chartHeight;
    return { x, y };
  });

  const linePath = pathPoints.map((point, index) => 
    index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
  ).join(' ');

  const areaPath = linePath + 
    ` L ${pathPoints[pathPoints.length - 1].x} ${height - padding}` +
    ` L ${padding} ${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="w-full">
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className={`stop-${color}-500`} stopOpacity="0.3" />
            <stop offset="100%" className={`stop-${color}-500`} stopOpacity="0.05" />
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + ratio * chartHeight;
          const value = maxValue - (ratio * range);
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

        {/* X-axis labels */}
        {data.map((point, index) => {
          if (index % Math.ceil(data.length / 6) === 0) {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            return (
              <g key={index}>
                <line 
                  x1={x} 
                  y1={height - padding} 
                  x2={x} 
                  y2={height - padding + 5} 
                  stroke="#6b7280" 
                  strokeWidth="1"
                />
                <text 
                  x={x} 
                  y={height - padding + 20} 
                  textAnchor="middle" 
                  className="text-xs fill-gray-500"
                >
                  {new Date(point.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* Area */}
        <path
          d={areaPath}
          fill={`url(#gradient-${color})`}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={`rgb(var(--color-${color}-500))`}
          strokeWidth="2"
          className={`stroke-${color}-500`}
        />

        {/* Data points */}
        {pathPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            className={`fill-${color}-500`}
          >
            <title>{`${data[index].label || data[index].date}: ${data[index].value.toLocaleString()}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}