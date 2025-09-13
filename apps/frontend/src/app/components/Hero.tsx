'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-revtrack-primary via-revtrack-secondary to-revtrack-primary/90 pt-20 pb-32 sm:pt-24 sm:pb-40">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce delay-700"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2 lg:items-center">
            {/* Left Column - Text Content */}
            <div className={`mx-auto w-full max-w-xl lg:mx-0 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm border border-white/20 mb-8">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Now Available - Advanced ML Forecasting
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                  Supply Chain
                </span>
              </h1>
              
              <p className="mt-6 text-xl leading-8 text-white/90">
                VendorFlow empowers businesses with intelligent vendor management, real-time inventory tracking, and AI-powered forecasting. Streamline operations and boost profitability.
              </p>
              
              <div className="mt-10 flex items-center gap-x-6 flex-wrap">
                <Link
                  href="/auth?mode=signup"
                  className="group relative overflow-hidden rounded-xl bg-white px-8 py-4 text-lg font-semibold text-revtrack-primary shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                
                <button className="group flex items-center text-white text-lg font-medium hover:text-blue-200 transition-colors duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm mr-3 group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  Watch Demo
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-16 flex items-center space-x-8 text-white/70">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-sm">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-sm">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm">Support</div>
                </div>
              </div>
            </div>

            {/* Right Column - Enhanced Dashboard Illustration */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative mx-auto w-full max-w-lg">
                {/* Main Dashboard Frame */}
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 transform rotate-3 hover:rotate-0 transition-transform duration-700">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-revtrack-primary to-revtrack-secondary rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-revtrack-text-primary text-xl font-semibold">VendorFlow</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-sm text-revtrack-text-light">Live</div>
                    </div>
                  </div>
                  
                  {/* Enhanced Charts and Stats */}
                  <div className="space-y-6">
                    {/* Animated Bar Chart */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">Revenue Growth</div>
                      <div className="flex items-end space-x-2 h-20">
                        {[40, 60, 80, 50, 90, 70, 95].map((height, index) => (
                          <div 
                            key={index}
                            className="flex-1 bg-gradient-to-t from-revtrack-primary to-revtrack-secondary rounded-t-lg transition-all duration-1000 delay-500"
                            style={{ 
                              height: `${height}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600">Total Inventory</div>
                            <div className="text-2xl font-bold text-green-600">12,847</div>
                          </div>
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600">Active Vendors</div>
                            <div className="text-2xl font-bold text-purple-600">142</div>
                          </div>
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-600">Recent Activity</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-xs text-gray-700">New order from Supplier A</div>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="text-xs text-gray-700">Inventory updated: +250 units</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Cards */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="text-sm font-medium text-gray-700">AI Forecasting</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Predicting demand...</div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="text-sm font-medium text-gray-700">Real-time Sync</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">All systems connected</div>
                </div>

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl -z-10 transform scale-110"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
