'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { forecastingApi, apiService } from '@/lib/api'

type ForecastTab = 'cost' | 'inventory' | 'demand'
type ViewMode = 'global' | 'vendor-specific'

export default function AdminForecastingPage() {
  const [activeTab, setActiveTab] = useState<ForecastTab>('cost')
  const [viewMode, setViewMode] = useState<ViewMode>('global')
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cost Forecasting State
  const [costParams, setCostParams] = useState({
    forecastMonths: 6,
    modelType: 'seasonal',
    baseMonthlyBudget: 50000, // Higher for admin global view
    includeSeasonalFactors: true,
    riskLevel: 3,
    vendorId: '',
  })
  const [costResult, setCostResult] = useState<any>(null)
  const [costGenerating, setCostGenerating] = useState(false)

  // Inventory Forecasting State
  const [inventoryParams, setInventoryParams] = useState({
    forecastPeriod: 30,
    includeSeasonality: true,
    safetyStockMultiplier: 1.5,
    vendorId: '',
    inventoryItems: [],
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
    vendorId: '',
  })
  const [demandResult, setDemandResult] = useState<any>(null)
  const [demandGenerating, setDemandGenerating] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    // Update params when view mode or vendor changes
    const vendorId = viewMode === 'vendor-specific' ? selectedVendor : ''
    setCostParams(prev => ({ ...prev, vendorId }))
    setInventoryParams(prev => ({ ...prev, vendorId }))
    setDemandParams(prev => ({ ...prev, vendorId }))
  }, [viewMode, selectedVendor])

  const loadVendors = async () => {
    try {
      const response = await apiService.request('vendors')
      setVendors(response.data?.vendors || [])
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

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
      
      // Add sample inventory items and timestamp to prevent caching
      const requestData = {
        ...inventoryParams,
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
        itemIds: ['item1', 'item2', 'item3'],
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

  const renderViewModeSelector = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Forecasting Scope</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="global">Global View (All Vendors)</option>
            <option value="vendor-specific">Vendor-Specific View</option>
          </select>
        </div>
        
        {viewMode === 'vendor-specific' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select a vendor...</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name || vendor.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Admin Capabilities</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Global View:</strong> Aggregate forecasts across all vendors</li>
          <li>• <strong>Vendor-Specific:</strong> Drill down to individual vendor forecasts</li>
          <li>• <strong>Comparative Analysis:</strong> Compare vendor performance and risks</li>
          <li>• <strong>System-wide Insights:</strong> Identify trends and optimization opportunities</li>
        </ul>
      </div>
    </div>
  )

  const renderCostForecasting = () => (
    <div className="space-y-6">
      {renderViewModeSelector()}
      
      {/* Cost Input Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Cost Forecasting Parameters 
          {viewMode === 'global' ? ' (Global)' : selectedVendor ? ' (Vendor-Specific)' : ''}
        </h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Monthly Budget ($) {viewMode === 'global' ? '(System-wide)' : ''}
            </label>
            <input
              type="number"
              value={costParams.baseMonthlyBudget}
              onChange={(e) => setCostParams(prev => ({ ...prev, baseMonthlyBudget: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min="0"
              step="1000"
            />
          </div>
        </div>
        
        <button
          onClick={generateCostForecast}
          disabled={costGenerating || (viewMode === 'vendor-specific' && !selectedVendor)}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {costGenerating ? 'Generating...' : `Generate ${viewMode === 'global' ? 'Global' : 'Vendor'} Cost Forecast`}
        </button>
      </div>

      {/* Cost Results */}
      {costResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Cost Forecast Results - {viewMode === 'global' ? 'System-wide Analysis' : 'Vendor Analysis'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600">Total Forecast Value</h4>
                <p className="text-2xl font-bold text-blue-600">${costResult.summary?.totalForecastValue?.toLocaleString() || '0'}</p>
                {viewMode === 'global' && <p className="text-xs text-gray-500">All vendors combined</p>}
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
                <h4 className="text-sm font-medium text-gray-600">Risk Level</h4>
                <p className={`text-2xl font-bold ${
                  costResult.riskAssessment?.level === 'low' ? 'text-green-600' :
                  costResult.riskAssessment?.level === 'medium' ? 'text-yellow-600' :
                  costResult.riskAssessment?.level === 'high' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {costResult.riskAssessment?.level?.toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Monthly Predictions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {costResult.monthlyPredictions?.map((month: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{month.month}</span>
                      <div className="text-right">
                        <div className="font-medium">${month.totalCost?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{month.confidence ? (month.confidence * 100).toFixed(0) : 0}% confidence</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Category Breakdown</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {costResult.categoryBreakdown?.map((category: any, index: number) => (
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

            {/* Admin-specific insights */}
            {viewMode === 'global' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h5 className="font-medium text-yellow-900 mb-2">System-wide Cost Insights</h5>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>• Total system cost growth rate: {costResult.overallGrowthRate?.toFixed(1)}%</p>
                  <p>• Peak cost month: {costResult.summary?.peakMonth}</p>
                  <p>• Optimization potential identified in {costResult.categoryBreakdown?.length || 0} categories</p>
                  <p>• Risk level requires {costResult.riskAssessment?.level === 'high' ? 'immediate' : 'regular'} monitoring</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderInventoryForecasting = () => (
    <div className="space-y-6">
      {renderViewModeSelector()}
      
      {/* Inventory Input Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Inventory Forecasting Parameters
          {viewMode === 'global' ? ' (All Vendors)' : selectedVendor ? ' (Selected Vendor)' : ''}
        </h3>
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
          disabled={inventoryGenerating || (viewMode === 'vendor-specific' && !selectedVendor)}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {inventoryGenerating ? 'Generating...' : `Generate ${viewMode === 'global' ? 'Global' : 'Vendor'} Inventory Forecast`}
        </button>
      </div>

      {/* Inventory Results */}
      {inventoryResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Inventory Forecast Results - {viewMode === 'global' ? 'System-wide Inventory Analysis' : 'Vendor Inventory Analysis'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600">Total Items</h4>
              <p className="text-2xl font-bold text-blue-600">{inventoryResult.summary?.totalItems || 0}</p>
              {viewMode === 'global' && <p className="text-xs text-gray-500">Across all vendors</p>}
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
              <h4 className="text-sm font-medium text-gray-600">Overall Risk Score</h4>
              <p className="text-2xl font-bold text-purple-600">{inventoryResult.summary?.overallRiskScore || 0}</p>
            </div>
          </div>

          {/* Category Analysis for Admin */}
          {inventoryResult.categoryAnalysis && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Category Risk Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventoryResult.categoryAnalysis.map((category: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium">{category.category}</h5>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <p>Items: {category.itemCount}</p>
                      <p>Current Stock: {category.totalCurrentStock}</p>
                      <p>Predicted Demand: {category.totalPredictedDemand}</p>
                      <p>Reorders Needed: {category.reorderRecommendations}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Analysis for Admin */}
          {inventoryResult.supplierAnalysis && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Supplier Performance Analysis</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Lead Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reliability</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Impact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryResult.supplierAnalysis.map((supplier: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {supplier.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.itemsSupplied}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.averageLeadTime} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.reliabilityScore}/5
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            supplier.riskImpact === 'low' ? 'bg-green-100 text-green-800' :
                            supplier.riskImpact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {supplier.riskImpact?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admin-specific insights */}
          {viewMode === 'global' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h5 className="font-medium text-blue-900 mb-2">System-wide Inventory Insights</h5>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Total inventory items across all vendors: {inventoryResult.summary?.totalItems}</p>
                <p>• System-wide critical stock items: {inventoryResult.summary?.criticalStockItems}</p>
                <p>• Average days until stockout: {inventoryResult.summary?.averageDaysUntilStockout}</p>
                <p>• Immediate reorder recommendations: {inventoryResult.summary?.itemsRequiringReorder}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderDemandForecasting = () => (
    <div className="space-y-6">
      {renderViewModeSelector()}
      
      {/* Demand Input Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Demand Forecasting Parameters
          {viewMode === 'global' ? ' (System-wide)' : selectedVendor ? ' (Vendor-specific)' : ''}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Period (Days)</label>
            <select
              value={demandParams.forecastPeriod}
              onChange={(e) => setDemandParams(prev => ({ ...prev, forecastPeriod: parseInt(e.target.value) }))}
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
          disabled={demandGenerating || (viewMode === 'vendor-specific' && !selectedVendor)}
          className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {demandGenerating ? 'Generating...' : `Generate ${viewMode === 'global' ? 'Global' : 'Vendor'} Demand Forecast`}
        </button>
      </div>

      {/* Demand Results */}
      {demandResult && (
        <div className="space-y-6">
          {/* Demand Forecast Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Demand Forecast Overview - {viewMode === 'global' ? 'System-wide' : selectedVendor || 'Vendor-specific'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Items Analyzed</h4>
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
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800">Categories</h4>
                <p className="text-2xl font-bold text-orange-900">{demandResult.categoryAnalysis?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Aggregated Forecast Summary */}
          {demandResult.aggregatedForecast && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                {viewMode === 'global' ? 'Global' : 'Vendor'} Demand Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-red-600">Peak Demand Periods</h4>
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
                  <h4 className="font-medium mb-3 text-blue-600">Low Demand Periods</h4>
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
              <h3 className="text-lg font-semibold mb-4">Category Performance Analysis</h3>
              <div className="space-y-4">
                {demandResult.categoryAnalysis.map((category: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-lg">{category.category}</h4>
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        category.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        category.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {category.riskLevel?.toUpperCase()} RISK
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Predicted Demand</p>
                        <p className="text-xl font-bold text-blue-600">{category.totalPredictedDemand?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Growth Rate</p>
                        <p className={`text-xl font-bold ${category.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {category.growthRate > 0 ? '+' : ''}{category.growthRate?.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Seasonal Pattern</p>
                        <p className="text-sm font-medium text-gray-700">{category.seasonalPattern}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Top Items</p>
                        <p className="text-xl font-bold text-purple-600">{category.topItems?.length || 0}</p>
                      </div>
                    </div>

                    {category.topItems && category.topItems.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Highest Demand Items:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {category.topItems.slice(0, 6).map((item: any, itemIndex: number) => (
                            <div key={itemIndex} className="px-3 py-2 bg-gray-50 rounded text-sm">
                              <div className="font-medium">{item.itemName}</div>
                              <div className="text-blue-600 font-bold">{item.predictedDemand?.toLocaleString()}</div>
                            </div>
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
            <h3 className="text-lg font-semibold mb-4">
              Model Performance & Analysis - {viewMode === 'global' ? 'System-wide' : 'Vendor-specific'}
            </h3>
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
                      <div className="text-right">
                        <div className="text-sm">{(model.accuracy * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">{model.trainingTime}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Data Quality Assessment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completeness:</span>
                    <span>{((demandResult.modelPerformance?.dataQuality?.completeness || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistency:</span>
                    <span>{((demandResult.modelPerformance?.dataQuality?.consistency || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outliers:</span>
                    <span>{demandResult.modelPerformance?.dataQuality?.outliers || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Insights */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Business Insights & Strategic Recommendations</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Key Findings</h4>
                <div className="space-y-2">
                  {demandResult.businessInsights?.keyFindings?.slice(0, 5).map((finding: string, index: number) => (
                    <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                      {finding}
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium mt-4 mb-2">Risk Factors</h4>
                <div className="space-y-2">
                  {demandResult.businessInsights?.riskFactors?.map((risk: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{risk.factor}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          risk.impact === 'high' ? 'bg-red-100 text-red-800' :
                          risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {risk.impact?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Mitigation: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Strategic Recommendations</h4>
                <div className="space-y-3">
                  {demandResult.businessInsights?.actionableRecommendations?.map((rec: any, index: number) => (
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
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>Impact: {rec.expectedImpact}</span>
                        <span>Timeline: {rec.timeframe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin-specific insights */}
            {viewMode === 'global' && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
                <h5 className="font-medium text-purple-900 mb-2">System-wide Demand Intelligence</h5>
                <div className="text-sm text-purple-800 space-y-1">
                  <p>• Cross-vendor demand patterns analyzed</p>
                  <p>• Market-wide seasonal trends identified</p>
                  <p>• Supply chain optimization opportunities detected</p>
                  <p>• Vendor performance benchmarking available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Advanced Forecasting - Admin Dashboard</h1>
          <div className="text-sm text-gray-600">
            System Administrator • ML-Powered Analytics & Insights
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
              { id: 'cost', name: 'Cost Forecasting', icon: '💰', description: 'System-wide cost analysis' },
              { id: 'inventory', name: 'Inventory Forecasting', icon: '📦', description: 'Multi-vendor inventory optimization' },
              { id: 'demand', name: 'Demand Forecasting', icon: '📈', description: 'Market demand intelligence' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ForecastTab)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex flex-col items-center space-y-1`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </div>
                <span className="text-xs text-gray-500">{tab.description}</span>
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
  )
}
