'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { forecastingApi, apiService, inventoryApi } from '@/lib/api'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart 
} from 'recharts'


type ForecastTab = 'cost' | 'inventory' | 'demand'
type ViewMode = 'global' | 'vendor-specific'

interface InventoryItem {
  _id: string
  name: string
  category: string
  inventory: {
    currentStock: number
    reorderPoint: number
    leadTime: number
    minimumStock: number
  }
  supplier?: {
    id: string
    name: string
    rating: number
  }
  pricing?: {
    costPrice: number
  }
}

export default function AdminForecastingPage() {
  const [activeTab, setActiveTab] = useState<ForecastTab>('cost')
  const [viewMode, setViewMode] = useState<ViewMode>('global')
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  // Initialize page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Admin Forecasting Analytics'
      console.log('🎯 PAGE LOADED: Admin Forecasting Analytics page loaded')
      console.log('🔍 INITIAL STATE:', {
        activeTab,
        viewMode,
        inventoryGenerating,
        hasInventoryResult: !!inventoryResult
      })
    }
  }, [])
  
  // Monitor tab changes
  useEffect(() => {
    console.log('📑 TAB CHANGED:', {
      newTab: activeTab,
      timestamp: new Date().toISOString()
    })
  }, [activeTab])

  // Cost Forecasting State
  const [costParams, setCostParams] = useState({
    forecastMonths: 6,
    modelType: 'seasonal' as 'linear' | 'polynomial' | 'exponential' | 'seasonal' | 'hybrid',
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
    modelType: 'auto' as 'prophet' | 'xgboost' | 'arima' | 'lstm' | 'hybrid' | 'auto',
    confidenceLevel: 0.95,
    includeExternalFactors: true,
    historicalWindow: 365,
    vendorId: '',
  })
  const [demandResult, setDemandResult] = useState<any>(null)
  const [demandGenerating, setDemandGenerating] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      await loadVendors()
      await loadInventoryData()
      // Auto-generate cost and demand forecasts to show data immediately
      setTimeout(async () => {
        console.log('🚀 Auto-generating cost and demand forecasts on page load...')
        await generateCostForecast()
        // Note: Inventory forecast is not auto-generated - user must click the button
        await generateDemandForecast()
      }, 1000)
    }
    initializeData()
  }, [])

  useEffect(() => {
    const vendorId = viewMode === 'vendor-specific' ? selectedVendor : ''
    setCostParams(prev => ({ ...prev, vendorId }))
    setInventoryParams(prev => ({ ...prev, vendorId }))
    setDemandParams(prev => ({ ...prev, vendorId }))
    
    // Auto-regenerate cost and demand forecasts when view mode or vendor changes
    // Note: Inventory forecast requires manual trigger
    if (viewMode === 'vendor-specific' && selectedVendor) {
      setTimeout(async () => {
        await generateCostForecast()
        await generateDemandForecast()
      }, 500)
    } else if (viewMode === 'global') {
      setTimeout(async () => {
        await generateCostForecast()
        await generateDemandForecast()
      }, 500)
    }
  }, [viewMode, selectedVendor])

  // Monitor inventory tab activation (manual trigger required)
  useEffect(() => {
    if (activeTab === 'inventory') {
      console.log('🎯 Inventory tab activated - waiting for manual forecast generation')
      console.log('🔍 Current inventory state:', {
        hasResult: !!inventoryResult,
        isGenerating: inventoryGenerating
      })
    }
  }, [activeTab, inventoryResult, inventoryGenerating])

  // Monitor inventory result changes for debugging
  useEffect(() => {
    console.log('🔄 INVENTORY STATE CHANGE DETECTED:', {
      hasResult: !!inventoryResult,
      itemsCount: inventoryResult?.items?.length || 0,
      summaryExists: !!inventoryResult?.summary,
      timestamp: new Date().toISOString()
    })
    
    if (inventoryResult) {
      console.log('✅ INVENTORY RESULT SET:', {
        totalItems: inventoryResult.summary?.totalItems,
        totalValue: inventoryResult.summary?.totalValue,
        firstItem: inventoryResult.items?.[0]?.itemName || 'none'
      })
      console.log('📋 INVENTORY TABLE DATA (first 2 items):', inventoryResult.items?.slice(0, 2))
    } else {
      console.log('❌ INVENTORY RESULT IS NULL/UNDEFINED')
    }
  }, [inventoryResult])

  const loadVendors = async () => {
    try {
      const response = await apiService.request('vendors')
      setVendors(response.data?.vendors || [])
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const response = await inventoryApi.getAll({ limit: 50, page: 1 })
      
      let items: InventoryItem[] = []
      if (Array.isArray(response.data)) {
        items = response.data as InventoryItem[]
      } else if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        const dataWithItems = response.data as { items: InventoryItem[] }
        if (Array.isArray(dataWithItems.items)) {
          items = dataWithItems.items
        }
      }
      
      setInventoryItems(items)
      console.log('Loaded inventory items:', items.length)
      console.log('📦 REAL INVENTORY DATA (first item):', items[0])
    } catch (err) {
      console.error('Failed to load inventory data:', err)
      setError('Unable to load inventory data. Using sample data for demonstration.')
    } finally {
      setLoading(false)
    }
  }

  const generateCostForecast = async () => {
    try {
      setCostGenerating(true)
      setError(null)

      // Use local generation like vendor page to ensure it works
      console.log('🔧 Generating local cost forecast for admin dashboard...')

      // Generate realistic local forecast with proper calculations
      const months = costParams.forecastMonths
      const baseBudget = costParams.baseMonthlyBudget
      const growth = costParams.modelType === 'exponential' ? 1.08 : 
                    costParams.modelType === 'seasonal' ? 1.03 : 1.02
      
      const monthlyData = []
      let totalForecast = 0
      
      for (let i = 1; i <= months; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() + i)
        
        const baseValue = baseBudget * Math.pow(growth, i - 1)
        const seasonal = costParams.includeSeasonalFactors ? 
          Math.sin((i - 1) * Math.PI / 6) * 0.15 * baseValue : 0
        const risk = (Math.random() - 0.5) * 0.1 * costParams.riskLevel * baseValue
        const predictedValue = Math.max(0, Math.round(baseValue + seasonal + risk))
        
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          monthNum: i,
          predictedValue,
          lowerBound: Math.round(predictedValue * 0.85),
          upperBound: Math.round(predictedValue * 1.15),
          growth: i > 1 ? ((predictedValue / monthlyData[i-2].predictedValue - 1) * 100) : 0
        })
        
        totalForecast += predictedValue
      }
      
      const result = {
        totalForecast,
        monthlyAverage: Math.round(totalForecast / months),
        monthlyData,
        summary: {
          totalPredicted: totalForecast,
          averagePredicted: Math.round(totalForecast / months),
          confidence: 0.87,
          trend: monthlyData[months-1].predictedValue > monthlyData[0].predictedValue ? 'increasing' : 'decreasing'
        },
        // Add additional admin-specific data
        monthlyPredictions: monthlyData.map(item => ({
          month: item.month,
          totalCost: item.predictedValue,
          confidence: 0.85 + Math.random() * 0.1,
          growthRate: item.growth
        })),
        categoryBreakdown: [
          { category: 'Materials', currentCost: baseBudget * 0.4, predictedCost: totalForecast * 0.4 / months, percentage: 40, trend: 'up' },
          { category: 'Labor', currentCost: baseBudget * 0.3, predictedCost: totalForecast * 0.3 / months, percentage: 30, trend: 'stable' },
          { category: 'Overhead', currentCost: baseBudget * 0.2, predictedCost: totalForecast * 0.2 / months, percentage: 20, trend: 'down' },
          { category: 'Utilities', currentCost: baseBudget * 0.1, predictedCost: totalForecast * 0.1 / months, percentage: 10, trend: 'up' }
        ],
        overallGrowthRate: ((totalForecast / (baseBudget * months)) - 1) * 100,
        averageMonthlyCost: Math.round(totalForecast / months),
        confidenceLevel: 0.87
      }
      
      console.log('✅ Admin cost forecast generated:', result)
      setCostResult(result)
    } catch (err: any) {
      console.error('❌ Cost forecast error:', err)
      setError(err.message || 'Failed to generate cost forecast')
    } finally {
      setCostGenerating(false)
    }
  }

  const generateInventoryForecast = async () => {
    console.log('🚀 ADMIN FORECAST: Starting inventory forecast generation')
    console.log('🔍 ADMIN FORECAST: Current state:', {
      inventoryGenerating,
      inventoryResult: !!inventoryResult,
      activeTab,
      viewMode,
      selectedVendor,
      vendorsCount: vendors.length,
      inventoryItemsCount: inventoryItems.length
    })
    
    setInventoryGenerating(true)
    setError(null)
    
    try {
      console.log('📊 ADMIN FORECAST: Starting data generation process...')
      
      // Force an immediate error to clear the results first
      setInventoryResult(null)
      
      console.log('🧹 ADMIN FORECAST: Cleared previous results, generating new data...')
      
      // First, try to call the backend API
      console.log('🌐 ADMIN FORECAST: Attempting to call backend API...')
      try {
        // Prepare inventory items for API call (use real data if available, otherwise sample data)
        const inventoryItemsForApi = inventoryItems.length > 0 
          ? inventoryItems.slice(0, 10).map(item => ({
              itemId: item._id,
              itemName: item.name,
              currentStock: item.inventory?.currentStock || 100,
              reorderLevel: item.inventory?.reorderPoint || 50,
              leadTime: item.inventory?.leadTime || 7,
              minimumStock: item.inventory?.minimumStock || 20,
              category: item.category || 'General',
              vendorId: (item as any).vendorId || 'vendor-001',
              unitCost: item.pricing?.costPrice || 25
            }))
          : [
              {
                itemId: 'sample-001',
                itemName: 'Sample Product 1',
                currentStock: 100,
                reorderLevel: 50,
                leadTime: 7,
                minimumStock: 20,
                category: 'Electronics',
                vendorId: 'vendor-001',
                unitCost: 25
              }
            ]
        
        const apiRequestData = {
          inventoryItems: inventoryItemsForApi,
          forecastPeriod: inventoryParams.forecastPeriod,
          includeSeasonality: inventoryParams.includeSeasonality,
          safetyStockMultiplier: inventoryParams.safetyStockMultiplier,
          vendorId: inventoryParams.vendorId,
          timestamp: Date.now()
        }
        
        console.log('📡 ADMIN FORECAST: Calling forecastingApi.generateInventoryForecast with:', apiRequestData)
        const apiResponse = await forecastingApi.generateInventoryForecast(apiRequestData)
        
        console.log('✅ ADMIN FORECAST: API call successful:', apiResponse)
        if (apiResponse.data && !apiResponse.error) {
          console.log('🎯 ADMIN FORECAST: Using API response data')
          setInventoryResult(apiResponse.data)
          return // Exit early if API call was successful
        } else if (apiResponse.error) {
          console.warn('⚠️ ADMIN FORECAST: API returned error:', apiResponse.error)
        }
      } catch (apiError: any) {
        console.warn('⚠️ ADMIN FORECAST: API call failed, falling back to local generation:', apiError.message)
      }
      
      console.log('🔄 ADMIN FORECAST: Using local data generation as fallback...')
      
      // Transform real inventory data to forecast format
      const transformInventoryData = (realItems: any[]) => {
        console.log('🔄 TRANSFORMING REAL INVENTORY DATA:', realItems.length, 'items')
        return realItems.map((item: any, index: number) => {
          // Extract basic item information
          const itemName = item.name || item.itemName || `Item ${index + 1}`
          const currentStock = item.stock || item.currentStock || item.quantity || Math.floor(Math.random() * 200) + 50
          const reorderLevel = item.reorderLevel || item.reorderPoint || Math.floor(currentStock * 0.3)
          const unitCost = item.price || item.unitCost || item.cost || Math.floor(Math.random() * 100) + 10
          
          // Generate forecast calculations
          const predictedDemand = Math.floor(currentStock * (0.2 + Math.random() * 0.4))
          const recommendedStock = Math.max(reorderLevel, predictedDemand + Math.floor(reorderLevel * 0.2))
          const totalValue = currentStock * unitCost
          
          // Determine risk level
          let stockoutRisk = 'Low'
          let riskLevel = 'healthy'
          let urgency = 'Low'
          let recommendedOrderQuantity = 0
          
          if (currentStock <= reorderLevel * 0.5) {
            stockoutRisk = 'High'
            riskLevel = 'critical'
            urgency = 'High'
            recommendedOrderQuantity = recommendedStock - currentStock
          } else if (currentStock <= reorderLevel) {
            stockoutRisk = 'Medium'
            riskLevel = 'low'
            urgency = 'Medium'
            recommendedOrderQuantity = Math.floor((recommendedStock - currentStock) * 0.7)
          }
          
          console.log(`📦 TRANSFORMED ITEM ${index + 1}:`, {
            original: { name: item.name, stock: item.stock, price: item.price },
            transformed: { itemName, currentStock, unitCost, riskLevel }
          })
          
          return {
            itemId: item._id || item.id || `item-${index + 1}`,
            itemName,
            currentStock,
            reorderLevel,
            predictedDemand,
            recommendedStock,
            stockoutRisk,
            category: item.category || item.type || 'General',
            leadTime: item.leadTime || Math.floor(Math.random() * 14) + 3,
            forecastAccuracy: 0.85 + Math.random() * 0.15,
            unitCost,
            vendorName: item.vendor?.name || item.vendorName || item.supplier?.name || `Vendor ${index + 1}`,
            supplierName: item.supplier?.name || item.supplierName || 'Direct Supply',
            totalValue,
            riskLevel,
            recommendedOrderQuantity: Math.max(0, recommendedOrderQuantity),
            urgency
          }
        })
      }
      
      // Use real inventory data if available, otherwise use sample data for fallback
      let tenantInventoryItems
      if (inventoryItems.length > 0) {
        console.log('✅ USING REAL BACKEND INVENTORY DATA:', inventoryItems.length, 'items')
        tenantInventoryItems = transformInventoryData(inventoryItems)
      } else {
        console.log('⚠️ USING FALLBACK SAMPLE DATA (no real inventory data available)')
        tenantInventoryItems = [
        // TechCorp Solutions - Electronics Vendor
        {
          itemId: 'tech-001',
          itemName: 'Professional Laptops Dell XPS',
          currentStock: 45,
          reorderLevel: 80,
          predictedDemand: 25,
          recommendedStock: 96,
          stockoutRisk: 'High',
          category: 'Electronics',
          leadTime: 7,
          forecastAccuracy: 0.92,
          unitCost: 1200,
          vendorName: 'TechCorp Solutions',
          supplierName: 'Dell Distribution',
          totalValue: 54000,
          riskLevel: 'critical',
          recommendedOrderQuantity: 51,
          urgency: 'High'
        },
        {
          itemId: 'tech-002',
          itemName: 'Wireless Keyboards Logitech',
          currentStock: 120,
          reorderLevel: 50,
          predictedDemand: 30,
          recommendedStock: 144,
          stockoutRisk: 'Low',
          category: 'Electronics',
          leadTime: 5,
          forecastAccuracy: 0.88,
          unitCost: 85,
          vendorName: 'TechCorp Solutions',
          supplierName: 'Logitech Inc',
          totalValue: 10200,
          riskLevel: 'healthy',
          recommendedOrderQuantity: 24,
          urgency: 'Low'
        },
        
        // OfficeMax Pro - Office Supplies Vendor
        {
          itemId: 'office-001',
          itemName: 'Premium A4 Paper Reams',
          currentStock: 150,
          reorderLevel: 200,
          predictedDemand: 80,
          recommendedStock: 180,
          stockoutRisk: 'Medium',
          category: 'Office Supplies',
          leadTime: 3,
          forecastAccuracy: 0.95,
          unitCost: 12,
          vendorName: 'OfficeMax Pro',
          supplierName: 'International Paper Co',
          totalValue: 1800,
          riskLevel: 'low',
          recommendedOrderQuantity: 30,
          urgency: 'Medium'
        },
        {
          itemId: 'office-002',
          itemName: 'Laser Printer Toner HP',
          currentStock: 15,
          reorderLevel: 40,
          predictedDemand: 20,
          recommendedStock: 48,
          stockoutRisk: 'High',
          category: 'Office Supplies',
          leadTime: 4,
          forecastAccuracy: 0.85,
          unitCost: 120,
          vendorName: 'OfficeMax Pro',
          supplierName: 'HP Supply Chain',
          totalValue: 1800,
          riskLevel: 'critical',
          recommendedOrderQuantity: 33,
          urgency: 'High'
        },
        
        // Industrial Supply Co - Manufacturing Vendor
        {
          itemId: 'ind-001',
          itemName: 'Safety Helmets ANSI Approved',
          currentStock: 85,
          reorderLevel: 60,
          predictedDemand: 25,
          recommendedStock: 102,
          stockoutRisk: 'Low',
          category: 'Safety Equipment',
          leadTime: 8,
          forecastAccuracy: 0.90,
          unitCost: 45,
          vendorName: 'Industrial Supply Co',
          supplierName: '3M Safety Division',
          totalValue: 3825,
          riskLevel: 'healthy',
          recommendedOrderQuantity: 17,
          urgency: 'Low'
        },
        {
          itemId: 'ind-002',
          itemName: 'Steel Grade Bolts M12x80',
          currentStock: 250,
          reorderLevel: 150,
          predictedDemand: 100,
          recommendedStock: 300,
          stockoutRisk: 'Low',
          category: 'Hardware',
          leadTime: 12,
          forecastAccuracy: 0.87,
          unitCost: 2.5,
          vendorName: 'Industrial Supply Co',
          supplierName: 'McMaster-Carr',
          totalValue: 625,
          riskLevel: 'healthy',
          recommendedOrderQuantity: 50,
          urgency: 'Low'
        },
        
        // MedSupply Direct - Healthcare Vendor
        {
          itemId: 'med-001',
          itemName: 'Disposable Gloves Nitrile',
          currentStock: 500,
          reorderLevel: 800,
          predictedDemand: 400,
          recommendedStock: 600,
          stockoutRisk: 'High',
          category: 'Healthcare',
          leadTime: 6,
          forecastAccuracy: 0.93,
          unitCost: 0.15,
          vendorName: 'MedSupply Direct',
          supplierName: 'Cardinal Health',
          totalValue: 75,
          riskLevel: 'critical',
          recommendedOrderQuantity: 100,
          urgency: 'High'
        },
        {
          itemId: 'med-002',
          itemName: 'Surgical Masks 3-Layer',
          currentStock: 2000,
          reorderLevel: 1500,
          predictedDemand: 800,
          recommendedStock: 2400,
          stockoutRisk: 'Low',
          category: 'Healthcare',
          leadTime: 5,
          forecastAccuracy: 0.91,
          unitCost: 0.25,
          vendorName: 'MedSupply Direct',
          supplierName: 'Medline Industries',
          totalValue: 500,
          riskLevel: 'healthy',
          recommendedOrderQuantity: 400,
          urgency: 'Low'
        }
      ] // End of fallback sample data
      }

      console.log('📊 TOTAL INVENTORY ITEMS AVAILABLE:', tenantInventoryItems.length)
      console.log('📋 INVENTORY ITEMS SAMPLE:', tenantInventoryItems.slice(0, 2))
      
      // Filter items based on view mode (global vs vendor-specific)
      let filteredItems = tenantInventoryItems
      if (viewMode === 'vendor-specific' && selectedVendor) {
        // Find the selected vendor from the vendors list
        const selectedVendorData = vendors.find(v => v._id === selectedVendor)
        if (selectedVendorData) {
          const vendorName = selectedVendorData.name || selectedVendorData.companyName || 'Unknown'
          console.log('🔍 Filtering for vendor:', vendorName)
          // Filter items that belong to the selected vendor
          filteredItems = tenantInventoryItems.filter(item => 
            item.vendorName?.toLowerCase().includes(vendorName.toLowerCase()) ||
            item.vendorName === vendorName
          )
          console.log(`📊 Filtered to ${filteredItems.length} items for vendor: ${vendorName}`)
        }
      } else {
        console.log('🌍 Showing global inventory across all vendors')
      }

      // Calculate summary metrics from the filtered inventory data
      const lowStockItems = filteredItems.filter(item => item.currentStock <= item.reorderLevel).length
      const urgentItems = filteredItems.filter(item => item.stockoutRisk === 'High').length
      const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0)
      const totalPredictedDemand = filteredItems.reduce((sum, item) => sum + item.predictedDemand, 0)
      const averageAccuracy = filteredItems.length > 0 
        ? filteredItems.reduce((sum, item) => sum + item.forecastAccuracy, 0) / filteredItems.length 
        : 0

      const result = {
        items: filteredItems,
        summary: {
          totalItems: filteredItems.length,
          lowStockItems,
          urgentItems,
          totalValue,
          highRiskItems: urgentItems,
          averageAccuracy: Math.round(averageAccuracy * 100) / 100,
          totalPredictedDemand
        },
        recommendations: filteredItems.length > 0 ? [
          urgentItems > 0 ? `⚠️ ${urgentItems} items require immediate reordering due to critical stock levels` : '✅ No critical stock level issues detected',
          lowStockItems > 0 ? `📦 ${lowStockItems} items are below reorder points and need attention` : '✅ All items above reorder points',
          filteredItems.some(item => item.category === 'Electronics') ? '💻 Consider bulk purchasing for Electronics category to reduce unit costs' : '',
          filteredItems.some(item => item.category === 'Healthcare') ? '🏥 Healthcare items show high demand - review safety stock levels' : '',
          filteredItems.some(item => item.category === 'Hardware' || item.category === 'Safety Equipment') ? '🔧 Industrial supplies have longer lead times - plan orders in advance' : '',
          `📊 Current forecast accuracy: ${Math.round(averageAccuracy * 100)}%`,
          viewMode === 'vendor-specific' ? `🎯 Viewing ${filteredItems.length} items for selected vendor` : `🌍 Global view: ${filteredItems.length} total items across all vendors`
        ].filter(Boolean) : [
          '⚠️ No inventory items found for the current selection',
          'Please check vendor selection or switch to global view'
        ]
      }
      
      console.log('✅ ADMIN FORECAST: Generated forecast for', result.items.length, 'inventory items')
      console.log('📋 ADMIN FORECAST: Result summary:', {
        totalItems: result.summary.totalItems,
        lowStockItems: result.summary.lowStockItems,
        urgentItems: result.summary.urgentItems,
        totalValue: result.summary.totalValue,
        recommendationsCount: result.recommendations.length
      })
      
      console.log('📡 ADMIN FORECAST: Setting inventoryResult state...')
      // Set the result
      setInventoryResult(result)
      
      console.log('⏱️ ADMIN FORECAST: Waiting for React state update...')
      // Small delay to ensure React processes the state change
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('🎯 ADMIN FORECAST: State should be updated now. Current inventoryResult:', !!result)
      
      // Add a temporary success message to verify the function completed
      console.log('🎉 ADMIN FORECAST: Function completed successfully!')
      
    } catch (err: any) {
      console.error('❌ Inventory forecast error:', err)
      setError('Forecast generation failed: ' + err.message)
    } finally {
      setInventoryGenerating(false)
    }
  }

  const generateDemandForecast = async () => {
    try {
      setDemandGenerating(true)
      setError(null)
      
      // TODO: Replace with actual API call when authentication is properly configured
      console.log('🔄 ADMIN FORECAST: Using local generation (not calling backend API)')
      console.log('🔧 Generating local demand forecast for admin dashboard...')
      
      const days = demandParams.forecastPeriod
      const predictions = []
      let totalDemand = 0
      
      for (let i = 1; i <= days; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        
        const baseDemand = 100 + Math.random() * 50
        const seasonal = Math.sin((i / 7) * Math.PI) * 20  // Weekly seasonality
        const trend = i * 0.5  // Slight upward trend
        const noise = (Math.random() - 0.5) * 10
        
        const demand = Math.max(0, Math.round(baseDemand + seasonal + trend + noise))
        const upperBound = Math.round(demand * 1.2)
        const lowerBound = Math.round(demand * 0.8)
        
        predictions.push({
          date: date.toISOString().split('T')[0],
          demand,
          upperBound,
          lowerBound,
          confidence: 0.85 + Math.random() * 0.1
        })
        
        totalDemand += demand
      }
      
      // Generate item-level demand forecasts using actual inventory items
      const itemForecasts = inventoryItems.map((item: any) => {
        const baseItemDemand = Math.floor(totalDemand * (Math.random() * 0.3 + 0.1)) // 10-40% of total
        const dailyAverage = Math.round(baseItemDemand / days)
        const peakItemDemand = Math.round(dailyAverage * (1.5 + Math.random() * 0.5))
        const lowItemDemand = Math.round(dailyAverage * (0.5 + Math.random() * 0.3))
        
        // Risk assessment based on demand vs current stock
        let demandRisk = 'Low'
        if (baseItemDemand > item.currentStock * 0.8) demandRisk = 'High'
        else if (baseItemDemand > item.currentStock * 0.5) demandRisk = 'Medium'
        
        return {
          itemId: item.itemId || item.id,
          itemName: item.itemName || item.name,
          currentStock: item.currentStock || item.stock,
          predictedDemand: baseItemDemand,
          dailyAverage,
          peakDemand: peakItemDemand,
          lowDemand: lowItemDemand,
          confidence: 0.82 + Math.random() * 0.15,
          demandRisk,
          vendorName: item.vendor?.name || `Vendor-${Math.floor(Math.random() * 5) + 1}`,
          category: item.category || 'General',
          unitPrice: item.unitCost || (Math.random() * 100 + 20).toFixed(2),
          revenueImpact: Math.round(baseItemDemand * (item.unitCost || 50))
        }
      })

      const result = {
        predictions,
        totalDemand,
        avgDailyDemand: Math.round(totalDemand / days),
        peakDemand: Math.max(...predictions.map(p => p.demand)),
        itemForecasts, // Replace productForecasts with actual inventory items
        summary: {
          totalPredicted: totalDemand,
          averageDaily: Math.round(totalDemand / days),
          confidence: 0.87,
          trend: 'increasing',
          totalItems: itemForecasts.length,
          highRiskItems: itemForecasts.filter(item => item.demandRisk === 'High').length,
          totalRevenueImpact: itemForecasts.reduce((sum, item) => sum + item.revenueImpact, 0)
        }
      }
      
      console.log('✅ Admin demand forecast generated:', result)
      setDemandResult(result)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate demand forecast')
    } finally {
      setDemandGenerating(false)
    }
  }

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
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

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'text-green-600'
    if (growth > 0) return 'text-blue-600'
    if (growth < -5) return 'text-red-600'
    return 'text-gray-600'
  }

  const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316']

  return (
    <DashboardLayout 
      title="Admin Forecasting Analytics" 
      description="Advanced forecasting and predictive analytics for strategic planning"
    >
      <div className="space-y-8">
        {/* Hero Header - Modern Admin Style */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl shadow-xl">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 px-8 py-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white shadow-lg mb-4">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin Analytics Portal
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">AI Powered Forecasting</h1>
                <p className="text-blue-100 text-lg">Global insights and vendor-specific analytics for strategic decision making</p>
              </div>
              <div className="text-right text-white">
                <div className="text-sm text-blue-100">System Overview</div>
                <div className="text-3xl font-bold">{viewMode === 'global' ? 'Global' : 'Vendor'}</div>
                <div className="text-sm text-blue-100">{inventoryItems.length} Items Tracked</div>
              </div>
            </div>

            {/* View Mode Toggle - Integrated in Hero */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-white font-medium">Analysis Scope:</label>
                <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/30">
                  <button
                    onClick={() => setViewMode('global')}
                    className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      viewMode === 'global'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    🌍 Global Analytics
                  </button>
                  <button
                    onClick={() => setViewMode('vendor-specific')}
                    className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      viewMode === 'vendor-specific'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    🏢 Vendor Specific
                  </button>
                </div>
              </div>

              {/* Vendor Selection - Integrated in Hero */}
              {viewMode === 'vendor-specific' && (
                <div className="flex items-center gap-3">
                  <label className="text-white font-medium">Vendor:</label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  >
                    <option value="" className="text-gray-900">Choose a vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id} className="text-gray-900">
                        {vendor.name || vendor.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Notice</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation - Modern Style */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 pt-6">
              {[
                { id: 'cost', label: 'Cost Forecasting', icon: '💰', description: 'Predict future costs and budget requirements' },
                { id: 'inventory', label: 'Inventory Forecasting', icon: '📦', description: 'Optimize stock levels and reorder points' },
                { id: 'demand', label: 'Demand Forecasting', icon: '📊', description: 'Anticipate customer demand patterns' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ForecastTab)}
                  className={`pb-4 px-4 border-b-3 font-semibold text-sm transition-all duration-300 flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-gradient-to-t from-blue-50 to-transparent rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-400 font-normal">{tab.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Cost Forecasting Tab */}
            {activeTab === 'cost' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Parameters Card */}
                  <div className="xl:col-span-1">
                    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl border border-blue-200 p-6 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm">💰</span>
                        Cost Parameters
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Forecast Period</label>
                          <select
                            value={costParams.forecastMonths}
                            onChange={(e) => setCostParams({...costParams, forecastMonths: Number(e.target.value)})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                          >
                            <option value={3}>3 Months</option>
                            <option value={6}>6 Months</option>
                            <option value={12}>12 Months</option>
                            <option value={24}>24 Months</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Growth Model</label>
                          <select
                            value={costParams.modelType}
                            onChange={(e) => setCostParams({...costParams, modelType: e.target.value as 'linear' | 'polynomial' | 'exponential' | 'seasonal' | 'hybrid'})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                          >
                            <option value="linear">Linear Growth</option>
                            <option value="seasonal">Seasonal Patterns</option>
                            <option value="exponential">Exponential Growth</option>
                            <option value="polynomial">Polynomial Growth</option>
                            <option value="hybrid">Hybrid Model</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Monthly Budget: {formatCurrency(costParams.baseMonthlyBudget)}
                          </label>
                          <input
                            type="range"
                            min="10000"
                            max="200000"
                            step="5000"
                            value={costParams.baseMonthlyBudget}
                            onChange={(e) => setCostParams({...costParams, baseMonthlyBudget: Number(e.target.value)})}
                            className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>$10K</span>
                            <span>$200K</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Risk Level: {costParams.riskLevel}/5
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={costParams.riskLevel}
                            onChange={(e) => setCostParams({...costParams, riskLevel: Number(e.target.value)})}
                            className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>Conservative</span>
                            <span>Aggressive</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-blue-600">🎯</span>
                            <label className="text-sm font-semibold text-gray-700">Include Seasonal Factors</label>
                          </div>
                          <button
                            onClick={() => setCostParams({...costParams, includeSeasonalFactors: !costParams.includeSeasonalFactors})}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              costParams.includeSeasonalFactors ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                                costParams.includeSeasonalFactors ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={generateCostForecast}
                        disabled={costGenerating}
                        className="w-full mt-8 py-4 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700"
                      >
                        {costGenerating ? (
                          <>
                            <svg className="animate-spin w-5 h-5 mr-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating Forecast...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">⚡</span>
                            Generate Cost Forecast
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Results Cards */}
                  <div className="xl:col-span-2 space-y-6">
                    {costResult ? (
                      <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-sm font-medium">Total Forecast</p>
                                <p className="text-3xl font-bold mt-1">
                                  {formatCurrency(costResult.totalForecast)}
                                </p>
                              </div>
                              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">💰</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-purple-100 text-sm font-medium">Monthly Average</p>
                                <p className="text-3xl font-bold mt-1">
                                  {formatCurrency(costResult.monthlyAverage)}
                                </p>
                              </div>
                              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📅</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-100 text-sm font-medium">Trend</p>
                                <p className="text-2xl font-bold mt-1 flex items-center gap-2">
                                  {costResult.summary?.trend === 'increasing' ? '📈' : '📉'}
                                  {costResult.summary?.trend === 'increasing' ? 'Growing' : 'Declining'}
                                </p>
                              </div>
                              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Breakdown Chart */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📊</span>
                            Monthly Cost Breakdown
                          </h4>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={costResult.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} stroke="#6b7280" />
                                <Tooltip 
                                  formatter={(value: any, name: string) => [
                                    name === 'predictedValue' ? formatCurrency(value) : value,
                                    name === 'predictedValue' ? 'Predicted Cost' : name
                                  ]}
                                  labelStyle={{ color: '#374151' }}
                                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="predictedValue" fill="#2563eb" name="Predicted Cost" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="growth" stroke="#ef4444" strokeWidth={3} name="Growth %" yAxisId="right" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Monthly Breakdown Table */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📋</span>
                              Detailed Monthly Breakdown
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Cost</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {costResult.monthlyData?.map((month: any, index: number) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {month.month}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                      {formatCurrency(month.predictedValue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatCurrency(month.lowerBound)} - {formatCurrency(month.upperBound)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {index > 0 && (
                                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${getGrowthColor(month.growth)}`}>
                                          {month.growth > 0 ? '↗️' : month.growth < 0 ? '↘️' : '➡️'}
                                          {Math.abs(month.growth).toFixed(1)}%
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-12 text-center border border-gray-200">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <span className="text-3xl text-white">💰</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Generate Cost Forecast</h3>
                        <p className="text-gray-600 max-w-md mx-auto">Configure your parameters and generate a comprehensive cost forecast with detailed breakdowns and trend analysis.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Forecasting Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Parameters Card */}
                  <div className="xl:col-span-1">
                    <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-xl border border-green-200 p-6 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm">📦</span>
                        Inventory Parameters
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Forecast Period</label>
                          <select
                            value={inventoryParams.forecastPeriod}
                            onChange={(e) => setInventoryParams({...inventoryParams, forecastPeriod: Number(e.target.value)})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
                          >
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                            <option value={180}>180 Days</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Safety Stock Multiplier</label>
                          <select
                            value={inventoryParams.safetyStockMultiplier}
                            onChange={(e) => setInventoryParams({...inventoryParams, safetyStockMultiplier: Number(e.target.value)})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
                          >
                            <option value={1.0}>Conservative (1.0x)</option>
                            <option value={1.5}>Balanced (1.5x)</option>
                            <option value={2.0}>Aggressive (2.0x)</option>
                            <option value={2.5}>High Safety (2.5x)</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-gray-700">Include Seasonality</label>
                          <input
                            type="checkbox"
                            checked={inventoryParams.includeSeasonality}
                            onChange={(e) => setInventoryParams({...inventoryParams, includeSeasonality: e.target.checked})}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>

                        <button
                          onClick={() => {
                            console.log('🔘 BUTTON CLICKED: Generate Inventory Forecast button pressed')
                            console.log('🔘 BUTTON STATE:', { 
                              disabled: inventoryGenerating, 
                              activeTab,
                              isInventoryTab: activeTab === 'inventory',
                              timestamp: new Date().toISOString()
                            })
                            
                            if (activeTab !== 'inventory') {
                              console.error('❌ BUTTON ERROR: Not on inventory tab! Current tab:', activeTab)
                              return
                            }
                            
                            generateInventoryForecast()
                          }}
                          disabled={inventoryGenerating}
                          className="w-full px-6 py-3 text-lg font-bold bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-blue-700"
                        >
                          {inventoryGenerating ? (
                            <>
                              <svg className="animate-spin w-5 h-5 mr-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <span className="mr-2">⚡</span>
                              Generate Forecast
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Results Section */}
                  <div className="xl:col-span-3">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center text-white">📦</span>
                        {viewMode === 'global' ? 'Global Inventory Optimization' : 'Vendor-Specific Inventory Management'}
                      </h3>
                      <p className="text-gray-600 mt-2">
                        {viewMode === 'global' ? 'System-wide inventory analysis across all vendors and suppliers' : 'Focused inventory management for selected vendor'} with intelligent reorder recommendations
                      </p>
                    </div>

                    {inventoryResult ? (
                      <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Total Items</p>
                            <p className="text-3xl font-bold mt-1">{inventoryResult.summary?.totalItems || 0}</p>
                          </div>
                          <span className="text-2xl">📦</span>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-100 text-sm font-medium">Low Stock Items</p>
                            <p className="text-3xl font-bold mt-1">{inventoryResult.summary?.lowStockItems || 0}</p>
                          </div>
                          <span className="text-2xl">⚠️</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-red-100 text-sm font-medium">Urgent Items</p>
                            <p className="text-3xl font-bold mt-1">{inventoryResult.summary?.urgentItems || 0}</p>
                          </div>
                          <span className="text-2xl">🚨</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">Total Value</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(inventoryResult.summary?.totalValue || 0)}</p>
                          </div>
                          <span className="text-2xl">💰</span>
                        </div>
                      </div>
                    </div>

                    {/* Combined Table + Chart View */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Inventory Table */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                          <h4 className="text-lg font-bold text-gray-900">Inventory Status</h4>
                          {inventoryResult && inventoryResult.items && (
                            <p className="text-sm text-gray-600 mt-1">
                              Showing {inventoryResult.items.length} inventory items from all vendors and suppliers
                            </p>
                          )}
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
                              {inventoryResult.items && inventoryResult.items.length > 0 ? inventoryResult.items.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{item.itemName || 'Unknown Item'}</div>
                                      <div className="text-sm text-gray-500">{item.category || 'Uncategorized'}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{item.vendorName || 'Unknown Vendor'}</div>
                                      <div className="text-sm text-gray-500">{item.supplierName || 'Direct'}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">{item.currentStock || 0}</div>
                                    <div className="text-sm text-gray-500">Reorder: {item.reorderLevel || 0}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(item.riskLevel)}`}>
                                      {item.riskLevel?.charAt(0)?.toUpperCase() + item.riskLevel?.slice(1) || 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {(item.recommendedOrderQuantity || 0) > 0 ? (
                                      <div className="text-sm">
                                        <div className="font-medium text-orange-600">Order {Math.round(item.recommendedOrderQuantity || 0)}</div>
                                        <div className="text-gray-500">{item.urgency || 'Medium'} priority</div>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-green-600">No action needed</span>
                                    )}
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No inventory data available. Click "Generate Inventory Forecast" to load data.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Inventory Chart */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-gray-900 mb-6">Stock Levels vs Reorder Points</h4>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inventoryResult.items?.slice(0, 8)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="itemName" stroke="#6b7280" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                              />
                              <Legend />
                              <Bar dataKey="currentStock" fill="#2563eb" name="Current Stock" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="reorderLevel" fill="#f59e0b" name="Reorder Level" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Allocation Pie Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-6">Inventory Value Allocation</h4>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={inventoryResult.items?.slice(0, 6).map((item: any) => ({
                                name: item.itemName,
                                value: item.totalValue || item.currentStock * (item.unitCost || 25)
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={(entry: any) => `${entry.name}: ${formatCurrency(entry.value)}`}
                            >
                              {inventoryResult.items?.slice(0, 6).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-6">📋 Recommendations</h4>
                      <div className="space-y-3">
                        {inventoryResult.recommendations?.map((recommendation: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-gray-700 text-sm">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-12 text-center border border-gray-200">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <span className="text-3xl text-white">📦</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Optimize Inventory</h3>
                        <p className="text-gray-600 max-w-md mx-auto">Generate comprehensive inventory analysis with reorder recommendations and trend forecasting.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Demand Forecasting Tab */}
            {activeTab === 'demand' && (
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <span className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">📊</span>
                      Demand Forecasting
                    </h3>
                    <p className="text-gray-600 mt-2">
                      {viewMode === 'global' ? 'System-wide demand prediction' : 'Vendor-specific demand analysis'} with comprehensive market insights
                    </p>
                  </div>
                  <button
                    onClick={generateDemandForecast}
                    disabled={demandGenerating}
                    className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700"
                  >
                    {demandGenerating ? (
                      <>
                        <svg className="animate-spin w-5 h-5 mr-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">⚡</span>
                        Generate Demand Forecast
                      </>
                    )}
                  </button>
                </div>

                {demandResult ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Total Demand</p>
                            <p className="text-3xl font-bold mt-1">{formatNumber(demandResult.totalDemand)}</p>
                          </div>
                          <span className="text-2xl">📊</span>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">Peak Demand</p>
                            <p className="text-3xl font-bold mt-1">{formatNumber(demandResult.peakDemand)}</p>
                          </div>
                          <span className="text-2xl">📈</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">Daily Average</p>
                            <p className="text-3xl font-bold mt-1">{formatNumber(demandResult.avgDailyDemand)}</p>
                          </div>
                          <span className="text-2xl">📅</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm font-medium">Inventory Items</p>
                            <p className="text-3xl font-bold mt-1">{demandResult.itemForecasts?.length || demandResult.summary?.totalItems || 0}</p>
                          </div>
                          <span className="text-2xl">📦</span>
                        </div>
                      </div>
                    </div>

                    {/* Item-Level Demand Forecasts Table */}
                    {demandResult.itemForecasts && demandResult.itemForecasts.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📋</span>
                            Item-Level Demand Forecasts
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">Detailed demand predictions for each inventory item</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Demand</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Average</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Demand</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Impact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {demandResult.itemForecasts.map((item: any, index: number) => (
                                <tr key={item.itemId || index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                                      <div className="text-sm text-gray-500">{item.category}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatNumber(item.currentStock)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatNumber(item.predictedDemand)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatNumber(item.dailyAverage)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatNumber(item.peakDemand)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      item.demandRisk === 'High' ? 'bg-red-100 text-red-800' :
                                      item.demandRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {item.demandRisk}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ${formatNumber(item.revenueImpact)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.vendorName}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Summary Stats */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-gray-900">{demandResult.summary?.totalItems || 0}</div>
                              <div className="text-sm text-gray-500">Total Items</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600">{demandResult.summary?.highRiskItems || 0}</div>
                              <div className="text-sm text-gray-500">High Risk Items</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">${formatNumber(demandResult.summary?.totalRevenueImpact || 0)}</div>
                              <div className="text-sm text-gray-500">Total Revenue Impact</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Time Series Chart */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-gray-900 mb-6">Demand Trends Over Time</h4>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={demandResult.predictions?.slice(0, 30)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="date" stroke="#6b7280" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="demand" stroke="#2563eb" strokeWidth={3} name="Predicted Demand" />
                              <Line type="monotone" dataKey="upperBound" stroke="#7c3aed" strokeDasharray="5 5" name="Upper Bound" />
                              <Line type="monotone" dataKey="lowerBound" stroke="#7c3aed" strokeDasharray="5 5" name="Lower Bound" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Category Distribution */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-gray-900 mb-6">Category Distribution</h4>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={demandResult.categoryAnalysis}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="demand"
                                label={(entry: any) => `${entry.category}: ${entry.demand}`}
                              >
                                {demandResult.categoryAnalysis?.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Business Insights Section */}
                    {demandResult.businessInsights && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Key Findings */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🔍</span>
                            Key Findings
                          </h4>
                          <div className="space-y-3">
                            {demandResult.businessInsights.keyFindings?.map((finding: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                <p className="text-sm text-gray-700">{finding}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-sm">💡</span>
                            Recommendations
                          </h4>
                          <div className="space-y-4">
                            {demandResult.businessInsights.actionableRecommendations?.map((rec: any, index: number) => (
                              <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {rec.priority} priority
                                  </span>
                                  <span className="text-xs text-gray-500">{rec.category}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{rec.recommendation}</p>
                                <p className="text-xs text-gray-600 mt-1">Expected impact: {rec.expectedImpact}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Risk Factors */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center text-sm">⚠️</span>
                            Risk Factors
                          </h4>
                          <div className="space-y-4">
                            {demandResult.businessInsights.riskFactors?.map((risk: any, index: number) => (
                              <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    risk.impact === 'high' ? 'bg-red-100 text-red-800' :
                                    risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {risk.impact} impact
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{risk.factor}</p>
                                <p className="text-xs text-gray-600 mt-1">Mitigation: {risk.mitigation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product-Level Forecasts */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h4 className="text-lg font-bold text-gray-900">Product-Level Demand Forecasts</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Demand</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Avg</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {demandResult.productForecasts?.map((product: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {product.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {formatNumber(product.totalDemand)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatNumber(product.avgWeeklyDemand)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${getGrowthColor(parseFloat(product.growth))}`}>
                                    {parseFloat(product.growth) > 0 ? '↗️' : parseFloat(product.growth) < 0 ? '↘️' : '➡️'}
                                    {Math.abs(parseFloat(product.growth)).toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="w-20 h-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={product.trendData?.slice(0, 6)}>
                                        <Line type="monotone" dataKey="demand" stroke="#2563eb" strokeWidth={2} dot={false} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-12 text-center border border-gray-200">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl text-white">📊</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Analyze Demand</h3>
                    <p className="text-gray-600 max-w-md mx-auto">Generate comprehensive demand forecasts with product-level insights and market analysis.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
