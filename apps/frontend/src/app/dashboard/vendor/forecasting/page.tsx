'use client'

import { useState, useEffect } from 'react'
import { VendorRoute } from '@/components/auth/RoleProtectedRoute'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { forecastingApi } from '@/lib/api'

type ForecastTab = 'cost' | 'inventory' | 'demand'

export default function VendorForecasting() {
  const [activeTab, setActiveTab] = useState<ForecastTab>('cost')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cost Forecasting State
  const [costParams, setCostParams] = useState({
    forecastMonths: 6,
    modelType: 'seasonal',
    baseMonthlyBudget: 10000,
    includeSeasonalFactors: true,
    riskLevel: 3,
  })
  const [costResult, setCostResult] = useState<any>(null)
  const [costGenerating, setCostGenerating] = useState(false)

  // Inventory Forecasting State
  const [inventoryParams, setInventoryParams] = useState({
    forecastPeriod: 30,
    includeSeasonality: true,
    safetyStockMultiplier: 1.5,
    inventoryItems: [
      {
        itemId: 'item1',
        currentStock: 150,
        reorderLevel: 50,
        leadTime: 7,
        category: 'Electronics',
        supplierInfo: {
          supplierId: 'supplier1',
          supplierName: 'Tech Supplies Co',
          reliability: 4,
          averageDeliveryTime: 5,
        },
        unitCost: 25.50,
        minOrderQuantity: 100,
      },
      {
        itemId: 'item2',
        currentStock: 75,
        reorderLevel: 25,
        leadTime: 14,
        category: 'Office Supplies',
        supplierInfo: {
          supplierId: 'supplier2',
          supplierName: 'Office Pro Ltd',
          reliability: 3,
          averageDeliveryTime: 10,
        },
        unitCost: 12.00,
        minOrderQuantity: 50,
      },
    ],
  })
  const [inventoryResult, setInventoryResult] = useState<any>(null)
  const [inventoryGenerating, setInventoryGenerating] = useState(false)

  // Demand Forecasting State
  const [demandParams, setDemandParams] = useState({
    forecastPeriod: 90,
    modelType: 'auto',
    confidenceLevel: 0.95,
    includeExternalFactors: true,
    historicalWindow: 365,
  })
  const [demandResult, setDemandResult] = useState<any>(null)
  const [demandGenerating, setDemandGenerating] = useState(false)

  const generateCostForecast = async () => {
    try {
      setCostGenerating(true)
      setError(null)
      
      const response = await forecastingApi.generateCostForecast(costParams)
      setCostResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate cost forecast')
    } finally {
      setCostGenerating(false)
    }
  }

  const generateInventoryForecast = async () => {
    try {
      setInventoryGenerating(true)
      setError(null)
      
      // Clear previous result to show fresh loading state
      setInventoryResult(null)
      
      // Add timestamp to prevent caching
      const requestData = {
        ...inventoryParams,
        timestamp: Date.now()
      }
      
      const response = await forecastingApi.generateInventoryForecast(requestData)
      setInventoryResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate inventory forecast')
    } finally {
      setInventoryGenerating(false)
    }
  }

  const generateDemandForecast = async () => {
    try {
      setDemandGenerating(true)
      setError(null)
      
      // Clear previous result to show fresh loading state
      setDemandResult(null)
      
      // Add timestamp and ensure required fields
      const requestData = {
        ...demandParams,
        modelType: demandParams.modelType === 'auto' ? 'arima' : demandParams.modelType,
        itemIds: ['item1', 'item2'],
        timestamp: Date.now()
      }
      
      const response = await forecastingApi.generateDemandForecast(requestData)
      setDemandResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate demand forecast')
    } finally {
      setDemandGenerating(false)
    }
  }

  const renderCostForecasting = () => (
    <div className="space-y-6">
      {/* Cost Input Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Forecasting Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Months</label>
            <select
              value={costParams.forecastMonths}
              onChange={(e) => setCostParams(prev => ({ ...prev, forecastMonths: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Type</label>
            <select
              value={costParams.modelType}
              onChange={(e) => setCostParams(prev => ({ ...prev, modelType: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="linear">Linear</option>
              <option value="polynomial">Polynomial</option>
              <option value="exponential">Exponential</option>
              <option value="seasonal">Seasonal</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Monthly Budget ($)</label>
            <input
              type="number"
              value={costParams.baseMonthlyBudget}
              onChange={(e) => setCostParams(prev => ({ ...prev, baseMonthlyBudget: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min="0"
              step="100"
            />
          </div>
        </div>
        
        <button
          onClick={generateCostForecast}
          disabled={costGenerating}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {costGenerating ? 'Generating...' : 'Generate Cost Forecast'}
        </button>
      </div>

      {/* Cost Results */}
      {costResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Forecast Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Total Forecast Value</h4>
              <p className="text-2xl font-bold text-blue-600">${costResult.summary?.totalForecastValue?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Average Monthly Cost</h4>
              <p className="text-2xl font-bold text-green-600">${costResult.summary?.averageMonthlyCost?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Growth Rate</h4>
              <p className="text-2xl font-bold text-purple-600">{costResult.overallGrowthRate?.toFixed(1) || '0'}%</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Confidence Score</h4>
              <p className="text-2xl font-bold text-orange-600">{costResult.summary?.confidenceScore || '0'}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Monthly Predictions</h4>
              <div className="space-y-2">
                {costResult.monthlyPredictions?.slice(0, 6).map((month: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{month.month}</span>
                    <span className="font-medium">${month.totalCost?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Category Breakdown</h4>
              <div className="space-y-2">
                {costResult.categoryBreakdown?.slice(0, 5).map((category: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{category.category}</span>
                    <div className="text-right">
                      <div className="font-medium">${category.predictedCost?.toLocaleString()}</div>
                      <div className={`text-xs ${category.trend === 'up' ? 'text-red-600' : category.trend === 'down' ? 'text-green-600' : 'text-gray-600'}`}>
                        {category.trend === 'up' ? '↑' : category.trend === 'down' ? '↓' : '→'} {category.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderInventoryForecasting = () => (
    <div className="space-y-6">
      {/* Inventory Input Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Forecasting Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Period (Days)</label>
            <select
              value={inventoryParams.forecastPeriod}
              onChange={(e) => setInventoryParams(prev => ({ ...prev, forecastPeriod: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={7}>7 Days (Short-term)</option>
              <option value={30}>30 Days (Medium-term)</option>
              <option value={60}>60 Days (Long-term)</option>
              <option value={90}>90 Days (Extended)</option>
              <option value={180}>180 Days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Safety Stock Multiplier</label>
            <select
              value={inventoryParams.safetyStockMultiplier}
              onChange={(e) => setInventoryParams(prev => ({ ...prev, safetyStockMultiplier: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={1}>1x (No Safety Stock)</option>
              <option value={1.2}>1.2x (Low Safety)</option>
              <option value={1.5}>1.5x (Medium Safety)</option>
              <option value={2}>2x (High Safety)</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={inventoryParams.includeSeasonality}
                onChange={(e) => setInventoryParams(prev => ({ ...prev, includeSeasonality: e.target.checked }))}
                className="mr-2"
              />
              Include Seasonality
            </label>
          </div>
        </div>
        
        <button
          onClick={generateInventoryForecast}
          disabled={inventoryGenerating}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {inventoryGenerating ? 'Generating...' : 'Generate Inventory Forecast'}
        </button>
      </div>

      {/* Current Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Current Inventory Items ({inventoryParams.inventoryItems.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryParams.inventoryItems.map((item, index) => (
                <tr key={item.itemId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reorderLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.leadTime} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Results */}
      {inventoryResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Inventory Forecast Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Total Items</h4>
              <p className="text-2xl font-bold text-blue-600">{inventoryResult.summary?.totalItems || 0}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Reorder Required</h4>
              <p className="text-2xl font-bold text-orange-600">{inventoryResult.summary?.itemsRequiringReorder || 0}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Critical Stock</h4>
              <p className="text-2xl font-bold text-red-600">{inventoryResult.summary?.criticalStockItems || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Avg Days to Stockout</h4>
              <p className="text-2xl font-bold text-purple-600">{inventoryResult.summary?.averageDaysUntilStockout || 0}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {inventoryResult.itemForecasts?.map((item: any) => (
              <div key={item.itemId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{item.itemName}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    item.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    item.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.riskLevel?.toUpperCase()} RISK
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Current Stock: {item.currentStock} • Days until stockout: {item.daysUntilStockout}
                </p>
                {item.reorderRecommendation?.shouldReorder && (
                  <div className={`p-2 rounded ${
                    item.reorderRecommendation.urgency === 'critical' ? 'bg-red-50 border border-red-200' :
                    item.reorderRecommendation.urgency === 'high' ? 'bg-orange-50 border border-orange-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <p className="text-sm font-medium">
                      Reorder Recommendation: {item.reorderRecommendation.recommendedQuantity} units by {item.reorderRecommendation.recommendedDate}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderDemandForecasting = () => (
    <div className="space-y-6">
      {/* Demand Input Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Demand Forecasting Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Period (Days)</label>
            <select
              value={demandParams.forecastPeriod}
              onChange={(e) => setDemandParams(prev => ({ ...prev, forecastPeriod: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
              <option value={180}>180 Days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Type</label>
            <select
              value={demandParams.modelType}
              onChange={(e) => setDemandParams(prev => ({ ...prev, modelType: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="auto">Auto Select</option>
              <option value="prophet">Prophet</option>
              <option value="xgboost">XGBoost</option>
              <option value="arima">ARIMA</option>
              <option value="lstm">LSTM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
            <select
              value={demandParams.confidenceLevel}
              onChange={(e) => setDemandParams(prev => ({ ...prev, confidenceLevel: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={0.80}>80%</option>
              <option value={0.85}>85%</option>
              <option value={0.90}>90%</option>
              <option value={0.95}>95%</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={generateDemandForecast}
          disabled={demandGenerating}
          className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {demandGenerating ? 'Generating...' : 'Generate Demand Forecast'}
        </button>
      </div>

      {/* Demand Results */}
      {demandResult && (
        <div className="space-y-6">
          {/* Demand Forecast Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Demand Forecast Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Total Items Analyzed</h4>
                <p className="text-2xl font-bold text-blue-900">{demandResult.itemPredictions?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Forecast Period</h4>
                <p className="text-2xl font-bold text-green-900">{demandResult.metadata?.forecastPeriod || 0} days</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800">Model Accuracy</h4>
                <p className="text-2xl font-bold text-purple-900">
                  {((demandResult.modelPerformance?.overallAccuracy || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Item Predictions */}
          {demandResult.itemPredictions && demandResult.itemPredictions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Item Demand Predictions</h3>
              <div className="space-y-4">
                {demandResult.itemPredictions.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{item.itemName || `Item ${item.itemId}`}</h4>
                      <span className="text-sm text-gray-600">Category: {item.category}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">7-Day Prediction</p>
                        <p className="text-xl font-bold text-blue-600">
                          {item.predictions?.slice(0, 7).reduce((sum: number, p: any) => sum + p.predictedDemand, 0) || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">30-Day Prediction</p>
                        <p className="text-xl font-bold text-green-600">
                          {item.predictions?.slice(0, 30).reduce((sum: number, p: any) => sum + p.predictedDemand, 0) || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Trend</p>
                        <p className={`text-xl font-bold ${
                          item.insights?.trendDirection === 'increasing' ? 'text-green-600' : 
                          item.insights?.trendDirection === 'decreasing' ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {item.insights?.trendDirection === 'increasing' ? '↗' : 
                           item.insights?.trendDirection === 'decreasing' ? '↘' : 
                           '→'} {item.insights?.trendDirection || 'stable'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Volatility: <span className={`font-medium ${
                          item.insights?.volatility === 'high' ? 'text-red-600' :
                          item.insights?.volatility === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>{item.insights?.volatility || 'low'}</span>
                      </span>
                      <span className="text-gray-600">
                        Seasonality: {((item.insights?.seasonalityStrength || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aggregated Forecast */}
          {demandResult.aggregatedForecast && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Total Demand Forecast</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Peak Demand Periods</h4>
                  <div className="space-y-2">
                    {demandResult.aggregatedForecast.peakDemandPeriods?.map((period: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{period.description}</span>
                          <span className="text-lg font-bold text-red-600">{period.peakValue}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Low Demand Periods</h4>
                  <div className="space-y-2">
                    {demandResult.aggregatedForecast.lowDemandPeriods?.map((period: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{period.description}</span>
                          <span className="text-lg font-bold text-blue-600">{period.lowValue}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Analysis */}
          {demandResult.categoryAnalysis && demandResult.categoryAnalysis.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Category Analysis</h3>
              <div className="space-y-4">
                {demandResult.categoryAnalysis.map((category: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{category.category}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        category.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        category.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {category.riskLevel?.toUpperCase()} RISK
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Predicted Demand</p>
                        <p className="text-xl font-bold text-blue-600">{category.totalPredictedDemand}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Growth Rate</p>
                        <p className={`text-xl font-bold ${category.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {category.growthRate > 0 ? '+' : ''}{category.growthRate?.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Seasonal Pattern</p>
                        <p className="text-sm font-medium">{category.seasonalPattern}</p>
                      </div>
                    </div>

                    {category.topItems && category.topItems.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Top Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {category.topItems.slice(0, 3).map((item: any, itemIndex: number) => (
                            <span key={itemIndex} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {item.itemName}: {item.predictedDemand}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Model Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Selected Model: {demandResult.modelPerformance?.selectedModel}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Overall Accuracy: {((demandResult.modelPerformance?.overallAccuracy || 0) * 100).toFixed(1)}%
                </p>
                <div className="space-y-2">
                  {demandResult.modelPerformance?.modelComparison?.map((model: any) => (
                    <div key={model.model} className={`flex items-center justify-between p-2 rounded ${model.recommended ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <span className="font-medium">{model.model.toUpperCase()}</span>
                      <span className="text-sm">{(model.accuracy * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Business Insights</h4>
                <div className="space-y-2">
                  {demandResult.businessInsights?.keyFindings?.slice(0, 3).map((finding: string, index: number) => (
                    <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                      {finding}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Actionable Recommendations</h3>
            <div className="space-y-3">
              {demandResult.businessInsights?.actionableRecommendations?.slice(0, 3).map((rec: any, index: number) => (
                <div key={index} className={`p-3 rounded-md ${
                  rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{rec.category}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm">{rec.recommendation}</p>
                  <p className="text-xs text-gray-600 mt-1">Expected Impact: {rec.expectedImpact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <VendorRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Advanced Forecasting</h1>
            <div className="text-sm text-gray-600">
              Vendor Dashboard • Enhanced ML-Powered Predictions
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'cost', name: 'Cost Forecasting', icon: '💰' },
                { id: 'inventory', name: 'Inventory Forecasting', icon: '📦' },
                { id: 'demand', name: 'Demand Forecasting', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ForecastTab)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'cost' && renderCostForecasting()}
            {activeTab === 'inventory' && renderInventoryForecasting()}
            {activeTab === 'demand' && renderDemandForecasting()}
          </div>
        </div>
      </DashboardLayout>
    </VendorRoute>
  )
}
