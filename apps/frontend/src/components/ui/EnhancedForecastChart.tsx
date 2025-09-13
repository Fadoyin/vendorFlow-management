'use client'

import { useState } from 'react'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface ForecastChartProps {
  title: string
  data: ChartDataPoint[]
  type?: 'bar' | 'line' | 'area'
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  formatValue?: (value: number) => string
}

export function EnhancedForecastChart({
  title,
  data,
  type = 'bar',
  height = 300,
  showGrid = true,
  showLegend = false,
  formatValue = (value) => value.toString()
}: ForecastChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No data available</p>
          </div>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue

  const getBarHeight = (value: number) => {
    return ((value - minValue) / range) * (height - 60)
  }

  const getColor = (index: number, isHovered: boolean = false) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ]
    
    const hoverColors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-indigo-600',
      'bg-pink-600',
      'bg-yellow-600',
      'bg-red-600',
      'bg-teal-600'
    ]

    return isHovered ? hoverColors[index % hoverColors.length] : colors[index % colors.length]
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Forecast Data</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height: height + 40 }}>
        {/* Grid Lines */}
        {showGrid && (
          <div className="absolute inset-0">
            {[0, 0.25, 0.5, 0.75, 1].map((percent, index) => (
              <div
                key={index}
                className="absolute w-full border-t border-gray-100"
                style={{ bottom: `${percent * (height - 60) + 40}px` }}
              >
                <span className="absolute -left-12 -top-2 text-xs text-gray-400">
                  {formatValue(minValue + (range * percent))}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Chart Bars */}
        <div className="absolute bottom-10 left-0 right-0 flex items-end justify-between gap-2 px-4">
          {data.map((point, index) => {
            const barHeight = getBarHeight(point.value)
            const isHovered = hoveredIndex === index

            return (
              <div key={index} className="flex-1 flex flex-col items-center relative group">
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                    <div className="font-medium">{point.label}</div>
                    <div>{formatValue(point.value)}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-200 cursor-pointer ${getColor(index, isHovered)} hover:shadow-lg`}
                  style={{ height: `${barHeight}px` }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Gradient overlay */}
                  <div className="w-full h-full rounded-t-lg bg-gradient-to-t from-transparent to-white opacity-20"></div>
                </div>

                {/* Label */}
                <div className="mt-2 text-xs text-gray-600 text-center font-medium truncate w-full">
                  {point.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* X-axis line */}
        <div className="absolute bottom-10 left-4 right-4 border-b border-gray-200"></div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Maximum</div>
          <div className="text-sm font-semibold text-gray-900">{formatValue(maxValue)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Average</div>
          <div className="text-sm font-semibold text-gray-900">
            {formatValue(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Minimum</div>
          <div className="text-sm font-semibold text-gray-900">{formatValue(minValue)}</div>
        </div>
      </div>
    </div>
  )
} 