'use client'

import React, { useState } from 'react'

interface ChartDataPoint {
  date: string
  historical?: number
  predicted: number
  confidence_lower: number
  confidence_upper: number
  type: 'historical' | 'predicted'
}

interface ForecastChartProps {
  data: ChartDataPoint[]
  width?: number
  height?: number
}

export function ForecastChart({ data, width = 800, height = 400 }: ForecastChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for chart</p>
      </div>
    )
  }

  // Chart dimensions and padding
  const padding = { top: 20, right: 40, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Find data ranges
  const allValues = data.flatMap(d => [
    d.historical || 0,
    d.predicted,
    d.confidence_lower,
    d.confidence_upper
  ]).filter(v => v > 0)
  
  const minValue = Math.min(...allValues) * 0.9
  const maxValue = Math.max(...allValues) * 1.1
  const valueRange = maxValue - minValue

  // Create scales
  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth
  const yScale = (value: number) => chartHeight - ((value - minValue) / valueRange) * chartHeight

  // Generate path strings
  const historicalPath = data
    .filter(d => d.historical !== undefined)
    .map((d, i) => {
      const x = xScale(i)
      const y = yScale(d.historical!)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')

  const predictedPath = data
    .filter(d => d.type === 'predicted')
    .map((d, i) => {
      const originalIndex = data.findIndex(item => item.date === d.date)
      const x = xScale(originalIndex)
      const y = yScale(d.predicted)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')

  // Confidence interval area
  const confidenceAreaPath = (() => {
    const predictedData = data.filter(d => d.type === 'predicted')
    if (predictedData.length === 0) return ''

    const upperPath = predictedData
      .map((d, i) => {
        const originalIndex = data.findIndex(item => item.date === d.date)
        const x = xScale(originalIndex)
        const y = yScale(d.confidence_upper)
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      })
      .join(' ')

    const lowerPath = predictedData
      .reverse()
      .map((d) => {
        const originalIndex = data.findIndex(item => item.date === d.date)
        const x = xScale(originalIndex)
        const y = yScale(d.confidence_lower)
        return `L ${x} ${y}`
      })
      .join(' ')

    return upperPath + lowerPath + ' Z'
  })()

  // Generate grid lines
  const gridLines = []
  const numYGridLines = 5
  for (let i = 0; i <= numYGridLines; i++) {
    const y = (i / numYGridLines) * chartHeight
    const value = maxValue - (i / numYGridLines) * valueRange
    gridLines.push(
      <g key={`grid-${i}`}>
        <line
          x1={0}
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="#f0f0f0"
          strokeWidth={1}
        />
        <text
          x={-10}
          y={y + 5}
          textAnchor="end"
          fontSize={12}
          fill="#666"
        >
          {Math.round(value)}
        </text>
      </g>
    )
  }

  // Generate date labels
  const dateLabels = data
    .filter((_, i) => i % Math.ceil(data.length / 8) === 0)
    .map((d, i) => {
      const originalIndex = data.findIndex(item => item.date === d.date)
      const x = xScale(originalIndex)
      const date = new Date(d.date)
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      return (
        <text
          key={`date-${i}`}
          x={x}
          y={chartHeight + 20}
          textAnchor="middle"
          fontSize={12}
          fill="#666"
        >
          {label}
        </text>
      )
    })

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          })
        }}
        onMouseLeave={() => {
          setHoveredPoint(null)
        }}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {gridLines}

          {/* Confidence interval area */}
          {confidenceAreaPath && (
            <path
              d={confidenceAreaPath}
              fill="#e5e7eb"
              fillOpacity={0.3}
              stroke="none"
            />
          )}

          {/* Historical line */}
          {historicalPath && (
            <path
              d={historicalPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Predicted line */}
          {predictedPath && (
            <path
              d={predictedPath}
              fill="none"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="8 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              {d.historical !== undefined && (
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.historical)}
                  r={4}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() => setHoveredPoint(d)}
                />
              )}
              {d.type === 'predicted' && (
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.predicted)}
                  r={4}
                  fill="#10b981"
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() => setHoveredPoint(d)}
                />
              )}
            </g>
          ))}

          {/* Date labels */}
          {dateLabels}

          {/* Y-axis label */}
          <text
            x={-40}
            y={chartHeight / 2}
            textAnchor="middle"
            fontSize={14}
            fill="#374151"
            transform={`rotate(-90, -40, ${chartHeight / 2})`}
          >
            Demand (Units)
          </text>

          {/* X-axis label */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 50}
            textAnchor="middle"
            fontSize={14}
            fill="#374151"
          >
            Date
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Historical Data</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-green-500 rounded border-dashed border border-green-500"></div>
          <span className="text-sm text-gray-600">Predicted Data</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-gray-300 rounded opacity-50"></div>
          <span className="text-sm text-gray-600">Confidence Interval</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none z-10"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: mousePosition.x > width / 2 ? 'translateX(-100%)' : 'none'
          }}
        >
          <p className="text-sm font-medium text-gray-900">
            {new Date(hoveredPoint.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          {hoveredPoint.historical !== undefined && (
            <p className="text-sm text-blue-600">
              Historical: {hoveredPoint.historical} units
            </p>
          )}
          {hoveredPoint.type === 'predicted' && (
            <>
              <p className="text-sm text-green-600">
                Predicted: {hoveredPoint.predicted} units
              </p>
              <p className="text-xs text-gray-500">
                Range: {hoveredPoint.confidence_lower} - {hoveredPoint.confidence_upper} units
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Simple Bar Chart Component for KPIs
interface BarChartProps {
  data: Array<{ name: string; value: number; color: string }>
  width?: number
  height?: number
}

export function SimpleBarChart({ data, width = 400, height = 200 }: BarChartProps) {
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...data.map(d => d.value)) * 1.1
  const barWidth = chartWidth / data.length * 0.8
  const barSpacing = chartWidth / data.length * 0.2

  return (
    <svg width={width} height={height} className="bg-white rounded-lg">
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight
          const x = i * (barWidth + barSpacing)
          const y = chartHeight - barHeight

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={d.color}
                rx={4}
                className="hover:opacity-80 transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={12}
                fill="#374151"
                fontWeight="500"
              >
                {d.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 15}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
              >
                {d.name}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
} 