'use client'

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
}

export function StatCard({ title, value, change, icon, color }: StatCardProps) {
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const changeBgColor = isPositive ? 'bg-green-50' : 'bg-red-50'

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full ${colorClasses[color]} flex items-center justify-center text-lg`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <div className="flex items-center">
            {isPositive ? (
              <ArrowUpIcon className="h-4 w-4 text-green-400" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-400" />
            )}
            <span className={`ml-2 font-medium ${changeColor}`}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-2 text-gray-500">from last month</span>
          </div>
        </div>
      </div>
    </div>
  )
}
