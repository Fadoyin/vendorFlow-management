'use client'

import { KPIReport } from '@/types'

interface KPICardsProps {
  data: KPIReport
}

export function KPICards({ data }: KPICardsProps) {
  const kpis = [
    {
      name: 'Orders',
      current: data.orders.current,
      previous: data.orders.previous,
      change: data.orders.change,
      color: 'blue',
    },
    {
      name: 'Revenue',
      current: data.revenue.current,
      previous: data.revenue.previous,
      change: data.revenue.change,
      color: 'green',
    },
    {
      name: 'Suppliers',
      current: data.suppliers.current,
      previous: data.suppliers.previous,
      change: data.suppliers.change,
      color: 'purple',
    },
    {
      name: 'Forecasts',
      current: data.forecasts.current,
      previous: data.forecasts.previous,
      change: data.forecasts.change,
      color: 'orange',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {kpi.name}
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {kpi.name === 'Revenue' ? `$${kpi.current.toLocaleString()}` : kpi.current}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className={`font-medium ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-2">from last month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
