'use client'

import { useState, useEffect, useRef } from 'react'

export default function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      name: 'AI-Powered Forecasting',
      description: 'Leverage machine learning to predict demand patterns, optimize inventory levels, and reduce stockouts by up to 40%.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      delay: 0
    },
    {
      name: 'Real-Time Inventory Tracking',
      description: 'Monitor stock levels across multiple locations instantly with live updates, automated alerts, and seamless synchronization.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h6m-3-3v6" />
        </svg>
      ),
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      delay: 200
    },
    {
      name: 'Intelligent Vendor Management',
      description: 'Centralize vendor relationships with automated performance tracking, contract management, and communication tools.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200',
      delay: 400
    },
    {
      name: 'Advanced Analytics Dashboard',
      description: 'Gain deep insights with comprehensive reporting, trend analysis, and customizable KPI tracking for data-driven decisions.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      delay: 600
    },
    {
      name: 'Automated Purchase Orders',
      description: 'Streamline procurement with intelligent reorder points, automated PO generation, and approval workflows.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-blue-500',
      bgColor: 'from-indigo-50 to-blue-50',
      borderColor: 'border-indigo-200',
      delay: 800
    },
    {
      name: 'Multi-Location Support',
      description: 'Manage inventory across warehouses, stores, and distribution centers with unified visibility and control.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'from-teal-500 to-green-500',
      bgColor: 'from-teal-50 to-green-50',
      borderColor: 'border-teal-200',
      delay: 1000
    },
  ]

  return (
    <section ref={sectionRef} id="features" className="py-24 sm:py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl lg:text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-revtrack-primary to-revtrack-secondary px-6 py-2 text-sm font-medium text-white shadow-lg mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Powerful Features
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-revtrack-text-primary sm:text-5xl lg:text-6xl">
            Everything You Need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-revtrack-primary to-revtrack-secondary">
              Scale Your Business
            </span>
          </h2>
          <p className="mt-6 text-xl leading-8 text-revtrack-text-secondary">
            Discover how VendorFlow's comprehensive suite of tools transforms your supply chain management with cutting-edge technology and intelligent automation.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3 xl:gap-10">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className={`group relative bg-white rounded-2xl border ${feature.borderColor} shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ 
                  animationDelay: `${feature.delay}ms`,
                  transitionDelay: `${feature.delay}ms`
                }}
              >
                {/* Gradient background overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-revtrack-text-primary group-hover:text-revtrack-primary transition-colors duration-300">
                      {feature.name}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-revtrack-text-secondary group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover arrow */}
                  <div className="mt-6 flex items-center text-revtrack-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
                    <span className="text-sm font-medium">Learn more</span>
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className={`w-full h-full bg-gradient-to-br ${feature.gradient} rounded-bl-full`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className={`text-center mt-20 transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <a
              href="/auth?mode=signup"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-revtrack-primary to-revtrack-secondary px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-revtrack-primary focus:ring-offset-2"
            >
              <span className="relative z-10">Explore All Features</span>
              <div className="absolute inset-0 bg-gradient-to-r from-revtrack-secondary to-revtrack-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            <div className="text-sm text-revtrack-text-light">
              No credit card required • 14-day free trial
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
