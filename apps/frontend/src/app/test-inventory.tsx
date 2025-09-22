'use client'

import { useState } from 'react'

export default function TestInventoryPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const generateTest = async () => {
    console.log('🧪 Starting test...')
    setLoading(true)
    
    const testResult = {
      items: [
        {
          itemId: 'test-1',
          itemName: 'Test Product 1',
          currentStock: 100,
          reorderLevel: 50,
          riskLevel: 'healthy',
          vendorName: 'Test Vendor',
          supplierName: 'Test Supplier',
          totalValue: 5000,
          recommendedOrderQuantity: 25,
          urgency: 'Low'
        },
        {
          itemId: 'test-2', 
          itemName: 'Test Product 2',
          currentStock: 25,
          reorderLevel: 80,
          riskLevel: 'critical',
          vendorName: 'Test Vendor 2',
          supplierName: 'Test Supplier 2',
          totalValue: 750,
          recommendedOrderQuantity: 75,
          urgency: 'High'
        }
      ],
      summary: {
        totalItems: 2,
        lowStockItems: 1,
        urgentItems: 1,
        totalValue: 5750
      }
    }

    console.log('🧪 Setting result:', testResult)
    setResult(testResult)
    setLoading(false)
    console.log('🧪 Result set!')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Inventory Forecast Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <button
            onClick={generateTest}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Test Forecast'}
          </button>
          
          <div className="mt-4">
            <p>Result exists: {result ? 'YES' : 'NO'}</p>
            <p>Items count: {result?.items?.length || 0}</p>
          </div>
        </div>

        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Items</p>
                    <p className="text-3xl font-bold mt-1">{result.summary?.totalItems || 0}</p>
                  </div>
                  <span className="text-2xl">📦</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Low Stock Items</p>
                    <p className="text-3xl font-bold mt-1">{result.summary?.lowStockItems || 0}</p>
                  </div>
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Urgent Items</p>
                    <p className="text-3xl font-bold mt-1">{result.summary?.urgentItems || 0}</p>
                  </div>
                  <span className="text-2xl">🚨</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Value</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(result.summary?.totalValue || 0)}</p>
                  </div>
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-lg font-bold text-gray-900">Inventory Status</h4>
              </div>
              <div className="overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                            <div className="text-sm text-gray-500">{item.category || 'General'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.vendorName}</div>
                            <div className="text-sm text-gray-500">{item.supplierName}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{item.currentStock}</div>
                          <div className="text-sm text-gray-500">Reorder: {item.reorderLevel}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(item.riskLevel)}`}>
                            {item.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.recommendedOrderQuantity > 0 ? (
                            <div className="text-sm">
                              <div className="font-medium text-orange-600">Order {item.recommendedOrderQuantity}</div>
                              <div className="text-gray-500">{item.urgency} priority</div>
                            </div>
                          ) : (
                            <span className="text-sm text-green-600">No action needed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 