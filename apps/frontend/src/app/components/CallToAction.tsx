'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function CallToAction() {
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

  return (
    <section ref={sectionRef} id="contact" className="relative overflow-hidden bg-gradient-to-br from-revtrack-primary via-revtrack-secondary to-revtrack-primary/90 py-24 sm:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce delay-700"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className={`mx-auto max-w-4xl text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-sm border border-white/20 mb-8">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Join 500+ Growing Companies
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Ready to Transform Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
              Supply Chain?
            </span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-white/90">
            Join thousands of businesses already experiencing the power of intelligent inventory management and vendor relationships. Start your transformation today.
          </p>

          {/* Benefits list */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '⚡', text: 'Setup in under 5 minutes' },
              { icon: '🎯', text: 'No credit card required' },
              { icon: '🚀', text: 'Free migration assistance' },
            ].map((benefit, index) => (
              <div key={index} className="flex items-center justify-center space-x-3 text-white/80">
                <span className="text-2xl">{benefit.icon}</span>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth?mode=signup"
              className="group relative overflow-hidden rounded-xl bg-white px-8 py-4 text-lg font-semibold text-revtrack-primary shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent min-w-[200px]"
            >
              <span className="relative z-10 flex items-center justify-center">
                Start Free Trial
                <svg className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
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
          <div className="mt-16 border-t border-white/20 pt-8">
            <p className="text-white/60 text-sm mb-6">Trusted by leading companies worldwide</p>
            <div className="flex items-center justify-center space-x-8 text-white/40">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm">Companies</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1M+</div>
                <div className="text-sm">Items Tracked</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm">Uptime</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm">Support</div>
              </div>
            </div>
          </div>

          {/* Security badges */}
          <div className="mt-12 flex items-center justify-center space-x-6 text-white/60">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">99.9% SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
