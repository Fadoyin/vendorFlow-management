'use client'

import { useState } from 'react'
// Temporarily disabled: import { useQuery } from '@tanstack/react-query'
import { useForecastStore } from '@/store'
import apiService, { analyticsApi } from '@/lib/api'
import { ForecastType, ForecastModel } from '@/types'
// Temporarily disabled: import toast from 'react-hot-toast'

// Temporary toast replacement
const toast = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message),
  loading: (message: string) => console.log('LOADING:', message),
}

// Temporary useQuery replacement
const useQuery = (options: any) => ({
  data: null,
  isLoading: false,
  error: null
})
import React from 'react'

export default function ForecastingPage() {
  const [forecastType, setForecastType] = useState<ForecastType>(ForecastType.COST)
  const [forecastModel, setForecastModel] = useState<ForecastModel>(ForecastModel.PROPHET)
  const [forecastPeriod, setForecastPeriod] = useState(30)
  const [confidenceLevel, setConfidenceLevel] = useState(95)
  
  const { forecasts, setForecasts, addForecast, setLoading, setError } = useForecastStore()

  const { data: forecastStats, isLoading: statsLoading } = useQuery({
    queryKey: ['forecast-stats'],
    queryFn: () => analyticsApi.getDashboardStats().then(response => response.data?.forecasts),
    refetchInterval: 300000, // Refetch every 5 minutes
  })

  const { data: forecastList, isLoading: listLoading } = useQuery({
    queryKey: ['forecasts'],
    queryFn: () => apiService.getForecasts(''),
    refetchInterval: 300000, // Refetch every 5 minutes
  })

  // Handle success and error effects separately
  React.useEffect(() => {
    if (forecastList) {
      setForecasts(forecastList as any)
    }
  }, [forecastList, setForecasts])

  React.useEffect(() => {
    if (forecastList === null && !listLoading) {
      setError('Failed to load forecasts')
    }
  }, [forecastList, listLoading, setError])

  const handleGenerateForecast = async () => {
    try {
      setLoading(true)
      let forecast
      
      if (forecastType === ForecastType.COST) {
        forecast = await apiService.generateCostForecast(forecastPeriod, forecastModel, confidenceLevel)
      } else {
        forecast = await apiService.generateInventoryForecast(forecastPeriod, forecastModel, confidenceLevel)
      }
      
      addForecast(forecast)
      toast.success(`${forecastType} forecast generated successfully!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate forecast')
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forecasting</h1>
        <p className="mt-2 text-sm text-gray-700">
          Generate AI-powered forecasts for costs, inventory, and demand
        </p>
      </div>

      {/* Forecast Generation Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Generate New Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="forecast-type" className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Type
            </label>
            <select
              id="forecast-type"
              value={forecastType}
              onChange={(e) => setForecastType(e.target.value as ForecastType)}
              className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value={ForecastType.COST}>Cost Forecast</option>
              <option value={ForecastType.INVENTORY}>Inventory Forecast</option>
              <option value={ForecastType.DEMAND}>Demand Forecast</option>
              <option value={ForecastType.REVENUE}>Revenue Forecast</option>
            </select>
          </div>

          <div>
            <label htmlFor="forecast-model" className="block text-sm font-medium text-gray-700 mb-2">
              ML Model
            </label>
            <select
              id="forecast-model"
              value={forecastModel}
              onChange={(e) => setForecastModel(e.target.value as ForecastModel)}
              className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value={ForecastModel.PROPHET}>Prophet</option>
              <option value={ForecastModel.XGBOOST}>XGBoost</option>
              <option value={ForecastModel.LINEAR_REGRESSION}>Linear Regression</option>
              <option value={ForecastModel.ARIMA}>ARIMA</option>
              <option value={ForecastModel.LSTM}>LSTM</option>
            </select>
          </div>

          <div>
            <label htmlFor="forecast-period" className="block text-sm font-medium text-gray-700 mb-2">
              Period (days)
            </label>
            <input
              type="number"
              id="forecast-period"
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(Number(e.target.value))}
              min="1"
              max="365"
              className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confidence-level" className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Level (%)
            </label>
            <input
              type="number"
              id="confidence-level"
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              min="0"
              max="100"
              className="w-full rounded-md border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerateForecast}
            disabled={statsLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {statsLoading ? 'Generating...' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      {/* Forecast Statistics */}
      {forecastStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Forecasts</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {forecastStats.totalForecasts || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Completed</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {forecastStats.completedForecasts || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">
              {forecastStats.pendingForecasts || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Failed</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">
              {forecastStats.failedForecasts || 0}
            </p>
          </div>
        </div>
      )}

      {/* Recent Forecasts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Forecasts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {forecasts && forecasts.length > 0 ? (
            forecasts.slice(0, 10).map((forecast) => (
              <div key={forecast._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {forecast.type} Forecast
                    </h4>
                    <p className="text-sm text-gray-500">
                      Model: {forecast.forecastModel} • Period: {forecast.forecastPeriod} days
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      forecast.status === 'completed' ? 'bg-green-100 text-green-800' :
                      forecast.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      forecast.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {forecast.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(forecast.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No forecasts generated yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
