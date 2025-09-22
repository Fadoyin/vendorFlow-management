'use client'

import { useState, useEffect } from 'react'

interface InventoryItem {
  itemId: string
  itemName: string
  currentStock: number
  reorderLevel: number
  leadTime: number
  minimumStock: number
  category: string
  vendorId: string
  unitCost: number
  vendorName?: string
  supplierName?: string
}

interface ForecastResult {
  items: Array<{
    itemId: string
    itemName: string
    currentStock: number
    predictedDemand: number
    recommendedStock: number
    reorderPoint: number
    risk: 'Low' | 'Medium' | 'High'
    totalValue: number
    vendorName?: string
    supplierName?: string
  }>
  summary: {
    totalItems: number
    lowStockItems: number
    urgentItems: number
    totalValue: number
  }
  recommendations: string[]
}

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logMessage])
    console.log(logMessage)
  }

  useEffect(() => {
    addLog('🎯 Debug page loaded successfully!')
    addLog('✅ React state management is working')
    addLog('✅ useEffect hooks are working')
  }, [])

  const generateLocalForecast = () => {
    addLog('🚀 Starting local inventory forecast generation...')
    setLoading(true)

    // Sample inventory data
    const inventoryItems: InventoryItem[] = [
      {
        itemId: 'ITEM-001',
        itemName: 'Widget A',
        currentStock: 150,
        reorderLevel: 50,
        leadTime: 7,
        minimumStock: 20,
        category: 'Electronics',
        vendorId: 'VENDOR-001',
        unitCost: 25.50,
        vendorName: 'TechCorp',
        supplierName: 'Global Supply Co'
      },
      {
        itemId: 'ITEM-002',
        itemName: 'Component B',
        currentStock: 75,
        reorderLevel: 100,
        leadTime: 14,
        minimumStock: 30,
        category: 'Components',
        vendorId: 'VENDOR-002',
        unitCost: 15.75,
        vendorName: 'ComponentsPlus',
        supplierName: 'Industrial Parts Ltd'
      },
      {
        itemId: 'ITEM-003',
        itemName: 'Material C',
        currentStock: 25,
        reorderLevel: 80,
        leadTime: 21,
        minimumStock: 15,
        category: 'Raw Materials',
        vendorId: 'VENDOR-003',
        unitCost: 8.25,
        vendorName: 'MaterialsWorld',
        supplierName: 'Raw Supply Inc'
      }
    ]

    addLog(`📦 Processing ${inventoryItems.length} inventory items...`)

    // Generate forecast data
    const forecastItems = inventoryItems.map(item => {
      const predictedDemand = Math.round(item.currentStock * 0.3 + Math.random() * 20)
      const recommendedStock = Math.max(item.reorderLevel, predictedDemand + item.minimumStock)
      const reorderPoint = Math.round(item.reorderLevel + (item.leadTime * predictedDemand / 30))
      
      let risk: 'Low' | 'Medium' | 'High' = 'Low'
      if (item.currentStock < item.reorderLevel) risk = 'High'
      else if (item.currentStock < item.reorderLevel * 1.5) risk = 'Medium'

      return {
        itemId: item.itemId,
        itemName: item.itemName,
        currentStock: item.currentStock,
        predictedDemand,
        recommendedStock,
        reorderPoint,
        risk,
        totalValue: item.currentStock * item.unitCost,
        vendorName: item.vendorName,
        supplierName: item.supplierName
      }
    })

    const summary = {
      totalItems: forecastItems.length,
      lowStockItems: forecastItems.filter(item => item.currentStock < item.reorderPoint).length,
      urgentItems: forecastItems.filter(item => item.risk === 'High').length,
      totalValue: forecastItems.reduce((sum, item) => sum + item.totalValue, 0)
    }

    const recommendations = [
      `${summary.urgentItems} items require immediate attention`,
      `Total inventory value: $${summary.totalValue.toFixed(2)}`,
      `${summary.lowStockItems} items are below reorder point`,
      'Consider increasing safety stock for high-risk items'
    ]

    const forecastResult: ForecastResult = {
      items: forecastItems,
      summary,
      recommendations
    }

    addLog('✅ Local forecast generation completed!')
    addLog(`📊 Generated forecasts for ${forecastItems.length} items`)
    addLog(`⚠️ Found ${summary.urgentItems} urgent items`)
    
    setResult(forecastResult)
    setLoading(false)
  }

  const testAPICall = async () => {
    addLog('🌐 Testing API call to backend...')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3004/forecasts/inventory-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventoryItems: [{
            itemId: 'TEST-001',
            itemName: 'Test Item',
            currentStock: 100,
            reorderLevel: 50,
            leadTime: 7,
            minimumStock: 20,
            category: 'Test',
            vendorId: 'test-vendor',
            unitCost: 25
          }],
          forecastPeriod: 30,
          timestamp: Date.now()
        })
      })

      addLog(`📡 API Response Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        addLog('✅ API call successful!')
        addLog(`📊 API returned: ${JSON.stringify(data).substring(0, 100)}...`)
      } else {
        const errorText = await response.text()
        addLog(`❌ API call failed: ${errorText.substring(0, 100)}...`)
      }
    } catch (error) {
      addLog(`❌ API call error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Inventory Forecasting Debug</h1>
        
        {/* Test Buttons */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="space-x-4">
            <button
              onClick={generateLocalForecast}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Local Forecast'}
            </button>
            <button
              onClick={testAPICall}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API Call'}
            </button>
            <button
              onClick={() => setLogs([])}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">📝 Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            {logs.length === 0 && <div>No logs yet...</div>}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">📊 Forecast Results</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total Items</h3>
                <p className="text-2xl font-bold text-blue-600">{result.summary.totalItems}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800">Low Stock</h3>
                <p className="text-2xl font-bold text-yellow-600">{result.summary.lowStockItems}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Urgent Items</h3>
                <p className="text-2xl font-bold text-red-600">{result.summary.urgentItems}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Total Value</h3>
                <p className="text-2xl font-bold text-green-600">${result.summary.totalValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Current Stock</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Predicted Demand</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Recommended Stock</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Risk</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Vendor</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.itemId}>
                      <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.currentStock}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.predictedDemand}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.recommendedStock}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.risk === 'High' ? 'bg-red-100 text-red-800' :
                          item.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.risk}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{item.vendorName}</td>
                      <td className="border border-gray-300 px-4 py-2">${item.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommendations */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">💡 Recommendations</h3>
              <ul className="list-disc list-inside space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 