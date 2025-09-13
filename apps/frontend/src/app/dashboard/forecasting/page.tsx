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
    baseMonthlyBudget: 50000,
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
      
      setInventoryResult(null)
      
      const requestData = {
        ...inventoryParams,
        inventoryItems: [
          {
            itemId: 'admin-item1',
            currentStock: 500,
            reorderLevel: 100,
            leadTime: 14,
            category: 'Electronics',
            supplierInfo: {
              supplierId: 'admin-supplier1',
              supplierName: 'Global Tech Supplies',
              reliability: 5,
              averageDeliveryTime: 10,
            },
            unitCost: 45.00,
            minOrderQuantity: 200,
          },
          {
            itemId: 'admin-item2',
            currentStock: 300,
            reorderLevel: 75,
            leadTime: 7,
            category: 'Office Equipment',
            supplierInfo: {
              supplierId: 'admin-supplier2',
              supplierName: 'Enterprise Office Co',
              reliability: 4,
              averageDeliveryTime: 5,
            },
            unitCost: 28.50,
            minOrderQuantity: 100,
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
      
      setDemandResult(null)
      
      const requestData = {
        ...demandParams,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTabIcon = (tab: ForecastTab) => {
    switch (tab) {
      case 'cost':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      case 'inventory':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      case 'demand':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  }

  return (
    <DashboardLayout 
      title="Forecasting Analytics" 
      description="Advanced forecasting and predictive analytics for strategic planning"
    >
      <div className="space-y-6">
        {/* Header Section with View Mode Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                Forecasting Analytics
              </h1>
              <p className="text-gray-600 mt-1">Generate intelligent forecasts to optimize your business operations</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('global')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'global'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Global View
                </button>
                <button
                  onClick={() => setViewMode('vendor-specific')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'vendor-specific'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Vendor Specific
                </button>
              </div>
            </div>
          </div>

          {/* Vendor Selection */}
          {viewMode === 'vendor-specific' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Select Vendor:</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Choose a vendor...</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name || vendor.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-medium">Forecast Generation Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Forecast Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: 'cost', label: 'Cost Forecasting', description: 'Predict future costs and budget requirements' },
                { key: 'inventory', label: 'Inventory Forecasting', description: 'Optimize stock levels and reorder points' },
                { key: 'demand', label: 'Demand Forecasting', description: 'Anticipate customer demand patterns' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as ForecastTab)}
                  className={`flex-1 px-6 py-4 text-left transition-all ${
                    activeTab === tab.key
                      ? 'bg-blue-50 border-b-2 border-blue-500 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getTabIcon(tab.key as ForecastTab)}
                    </div>
                    <div>
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Cost Forecasting Tab */}
            {activeTab === 'cost' && (
              <div className="space-y-6">
                {/* Parameters Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Forecast Parameters
                    </h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Period</label>
                          <select
                            value={costParams.forecastMonths}
                            onChange={(e) => setCostParams({...costParams, forecastMonths: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <option value={3}>3 Months</option>
                            <option value={6}>6 Months</option>
                            <option value={12}>12 Months</option>
                            <option value={24}>24 Months</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
                          <select
                            value={costParams.modelType}
                            onChange={(e) => setCostParams({...costParams, modelType: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <option value="linear">Linear Growth</option>
                            <option value="seasonal">Seasonal Patterns</option>
                            <option value="exponential">Exponential Growth</option>
                            <option value="auto">Auto-Select</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base Monthly Budget: {formatCurrency(costParams.baseMonthlyBudget)}
                        </label>
                        <input
                          type="range"
                          min="10000"
                          max="200000"
                          step="5000"
                          value={costParams.baseMonthlyBudget}
                          onChange={(e) => setCostParams({...costParams, baseMonthlyBudget: Number(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>$10K</span>
                          <span>$200K</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Risk Level: {costParams.riskLevel}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={costParams.riskLevel}
                          onChange={(e) => setCostParams({...costParams, riskLevel: Number(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Conservative</span>
                          <span>Aggressive</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Include Seasonal Factors</label>
                        <button
                          onClick={() => setCostParams({...costParams, includeSeasonalFactors: !costParams.includeSeasonalFactors})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            costParams.includeSeasonalFactors ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              costParams.includeSeasonalFactors ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={generateCostForecast}
                      disabled={costGenerating}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {costGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating Forecast...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Cost Forecast
                        </>
                      )}
                    </button>
                  </div>

                  {/* Results Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Forecast Results
                    </h3>

                    {costResult ? (
                      <div className="space-y-4">
                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-600 text-sm font-medium">Total Forecast</p>
                                <p className="text-2xl font-bold text-green-900">
                                  {formatCurrency(costResult.monthlyPredictions?.reduce((sum: number, month: any) => sum + month.totalCost, 0) || 0)}
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-600 text-sm font-medium">Monthly Average</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {formatCurrency((costResult.monthlyPredictions?.reduce((sum: number, month: any) => sum + month.totalCost, 0) || 0) / (costResult.monthlyPredictions?.length || 1))}
                                </p>
                              </div>
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Breakdown */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Monthly Breakdown</h4>
                          <div className="space-y-2">
                            {costResult.monthlyPredictions?.map((month: any, index: number) => (
                              <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                <span className="text-sm font-medium text-gray-700">{month.month}</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(month.totalCost)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        {costResult.recommendations && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {costResult.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="text-sm text-amber-800">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Forecast Generated</h3>
                        <p className="text-gray-600">Configure your parameters and click "Generate Cost Forecast" to see predictions</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Forecasting Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Inventory Parameters
                    </h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Period</label>
                          <select
                            value={inventoryParams.forecastPeriod}
                            onChange={(e) => setInventoryParams({...inventoryParams, forecastPeriod: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                          >
                            <option value={7}>7 Days</option>
                            <option value={14}>14 Days</option>
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Safety Stock Multiplier: {inventoryParams.safetyStockMultiplier}x
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={inventoryParams.safetyStockMultiplier}
                            onChange={(e) => setInventoryParams({...inventoryParams, safetyStockMultiplier: Number(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Include Seasonality</label>
                        <button
                          onClick={() => setInventoryParams({...inventoryParams, includeSeasonality: !inventoryParams.includeSeasonality})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                            inventoryParams.includeSeasonality ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              inventoryParams.includeSeasonality ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={generateInventoryForecast}
                      disabled={inventoryGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {inventoryGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating Forecast...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Generate Inventory Forecast
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Inventory Forecast Results
                    </h3>

                    {inventoryResult ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {inventoryResult.itemForecasts?.map((item: any, index: number) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                  item.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {item.riskLevel}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Current Stock:</span>
                                  <span className="font-medium text-gray-900 ml-2">{item.currentStock}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Recommended Quantity:</span>
                                  <span className="font-medium text-gray-900 ml-2">{item.reorderRecommendation?.recommendedQuantity || 0}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Should Reorder:</span>
                                  <span className={`font-medium ml-2 ${item.reorderRecommendation?.shouldReorder ? 'text-orange-600' : 'text-green-600'}`}>
                                    {item.reorderRecommendation?.shouldReorder ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Days Until Stockout:</span>
                                  <span className="font-medium text-gray-900 ml-2">{item.daysUntilStockout}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {inventoryResult.recommendations && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Inventory Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {inventoryResult.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="text-sm text-blue-800">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Forecast Generated</h3>
                        <p className="text-gray-600">Generate a forecast to see inventory recommendations and stock level predictions</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Demand Forecasting Tab */}
            {activeTab === 'demand' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Demand Parameters
                    </h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Period</label>
                          <select
                            value={demandParams.forecastPeriod}
                            onChange={(e) => setDemandParams({...demandParams, forecastPeriod: Number(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          >
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                            <option value={180}>180 Days</option>
                            <option value={365}>1 Year</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
                          <select
                            value={demandParams.modelType}
                            onChange={(e) => setDemandParams({...demandParams, modelType: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          >
                            <option value="auto">Auto-Select</option>
                            <option value="linear">Linear Regression</option>
                            <option value="seasonal">Seasonal ARIMA</option>
                            <option value="exponential">Exponential Smoothing</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confidence Level: {(demandParams.confidenceLevel * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0.8"
                          max="0.99"
                          step="0.01"
                          value={demandParams.confidenceLevel}
                          onChange={(e) => setDemandParams({...demandParams, confidenceLevel: Number(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Historical Window: {demandParams.historicalWindow} days
                        </label>
                        <input
                          type="range"
                          min="90"
                          max="730"
                          step="30"
                          value={demandParams.historicalWindow}
                          onChange={(e) => setDemandParams({...demandParams, historicalWindow: Number(e.target.value)})}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Include External Factors</label>
                        <button
                          onClick={() => setDemandParams({...demandParams, includeExternalFactors: !demandParams.includeExternalFactors})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            demandParams.includeExternalFactors ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              demandParams.includeExternalFactors ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={generateDemandForecast}
                      disabled={demandGenerating}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {demandGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating Forecast...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Generate Demand Forecast
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Demand Forecast Results
                    </h3>

                    {demandResult ? (
                      <div className="space-y-4">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-indigo-600 text-sm font-medium">Total Demand</p>
                                <p className="text-2xl font-bold text-indigo-900">{demandResult.totalDemand}</p>
                              </div>
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-purple-600 text-sm font-medium">Peak Demand</p>
                                <p className="text-2xl font-bold text-purple-900">{demandResult.peakDemand}</p>
                              </div>
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Top Items */}
                        {demandResult.categoryAnalysis && demandResult.categoryAnalysis.length > 0 && demandResult.categoryAnalysis[0].topItems && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              High Demand Items
                            </h4>
                            <div className="space-y-2">
                              {demandResult.categoryAnalysis[0].topItems.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      index === 0 ? 'bg-yellow-500' :
                                      index === 1 ? 'bg-gray-400' :
                                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}></div>
                                    {item.itemName || item.name}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">{item.predictedDemand || item.demand} units</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Business Insights */}
                        {demandResult.businessInsights && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Strategic Insights
                            </h4>
                            
                            {/* Key Findings */}
                            {demandResult.businessInsights.keyFindings && demandResult.businessInsights.keyFindings.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-green-800 mb-2">Key Findings:</h5>
                                <ul className="space-y-1">
                                  {demandResult.businessInsights.keyFindings.map((finding: string, index: number) => (
                                    <li key={index} className="text-sm text-green-800">• {finding}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Actionable Recommendations */}
                            {demandResult.businessInsights.actionableRecommendations && demandResult.businessInsights.actionableRecommendations.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-green-800 mb-2">Recommendations:</h5>
                                <div className="space-y-2">
                                  {demandResult.businessInsights.actionableRecommendations.map((rec: any, index: number) => (
                                    <div key={index} className="bg-green-100 rounded p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                                          rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                          'bg-blue-200 text-blue-800'
                                        }`}>
                                          {rec.priority}
                                        </span>
                                        <span className="text-xs text-green-700 font-medium">{rec.category}</span>
                                      </div>
                                      <p className="text-sm text-green-800">{rec.recommendation}</p>
                                      <div className="text-xs text-green-600 mt-1">
                                        Impact: {rec.expectedImpact} | Timeframe: {rec.timeframe}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Risk Factors */}
                            {demandResult.businessInsights.riskFactors && demandResult.businessInsights.riskFactors.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-green-800 mb-2">Risk Factors:</h5>
                                <div className="space-y-2">
                                  {demandResult.businessInsights.riskFactors.map((risk: any, index: number) => (
                                    <div key={index} className="bg-amber-50 border border-amber-200 rounded p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          risk.impact === 'high' ? 'bg-red-200 text-red-800' :
                                          risk.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                          'bg-green-200 text-green-800'
                                        }`}>
                                          {risk.impact} impact
                                        </span>
                                      </div>
                                      <p className="text-sm text-amber-800 font-medium">{risk.factor}</p>
                                      <p className="text-xs text-amber-700 mt-1">Mitigation: {risk.mitigation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Demand Forecast Generated</h3>
                        <p className="text-gray-600">Generate a forecast to see demand predictions and market insights</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
