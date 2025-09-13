'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Pricing() {
  const [isVisible, setIsVisible] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
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

  const plans = [
    {
      name: 'Free Trial',
      description: 'Perfect for getting started with VendorFlow',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Basic profile management',
        '10 orders per month',
        '1GB storage',
        'Email support',
        'Basic analytics',
      ],
      usageLimits: [
        'Orders: 10/month',
        'Storage: 1GB',
        'API Calls: 100/month',
      ],
      limitations: [],
      color: 'from-gray-500 to-gray-600',
      bgColor: 'from-gray-50 to-gray-100',
      borderColor: 'border-gray-200',
      popular: false,
    },
    {
      name: 'Standard',
      description: 'Most popular plan for growing businesses',
      monthlyPrice: 49,
      annualPrice: 490,
      features: [
        'Full order management',
        '100 orders per month',
        '10GB storage',
        'Priority support',
        'Advanced analytics',
        'Basic ML insights',
      ],
      usageLimits: [
        'Orders: 100/month',
        'Storage: 10GB',
        'API Calls: 1000/month',
      ],
      limitations: [],
      color: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200',
      popular: true,
    },
    {
      name: 'Premium',
      description: 'For businesses requiring advanced features',
      monthlyPrice: 149,
      annualPrice: 1490,
      features: [
        'Unlimited orders',
        '50GB storage',
        '24/7 phone support',
        'Advanced ML analytics',
        'API access',
        'Custom integrations',
        'Priority processing',
      ],
      usageLimits: [
        'Orders: Unlimited',
        'Storage: 50GB',
        'API Calls: 10000/month',
      ],
      limitations: [],
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      popular: false,
    },
  ]

  return (
    <section ref={sectionRef} id="pricing" className="py-24 sm:py-32 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className={`mx-auto max-w-4xl text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-revtrack-primary to-revtrack-secondary px-6 py-2 text-sm font-medium text-white shadow-lg mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Simple, Transparent Pricing
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight text-revtrack-text-primary sm:text-5xl lg:text-6xl">
            Choose the Perfect Plan
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-revtrack-primary to-revtrack-secondary">
              For Your Business
            </span>
          </h2>
          
          <p className="mt-6 text-xl leading-8 text-revtrack-text-secondary max-w-3xl mx-auto">
            Start with a 14-day free trial. No credit card required. Scale as you grow with flexible pricing that adapts to your business needs.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 flex items-center justify-center">
            <div className="relative flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`relative px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-revtrack-text-primary shadow-sm'
                    : 'text-revtrack-text-secondary hover:text-revtrack-text-primary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`relative px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  billingCycle === 'annual'
                    ? 'bg-white text-revtrack-text-primary shadow-sm'
                    : 'text-revtrack-text-secondary hover:text-revtrack-text-primary'
                }`}
              >
                Annual
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-3xl border-2 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                plan.popular ? 'border-purple-300 ring-4 ring-purple-100' : plan.borderColor
              } ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ 
                animationDelay: `${index * 200}ms`,
                transitionDelay: `${index * 200}ms`
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-1 text-sm font-medium text-white shadow-lg">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan header */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-revtrack-text-primary">{plan.name}</h3>
                  <p className="mt-2 text-revtrack-text-secondary">{plan.description}</p>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-revtrack-text-primary">
                        ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.floor(plan.annualPrice / 12)}
                      </span>
                      <span className="text-revtrack-text-secondary ml-1">/month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-revtrack-text-light mt-1">
                        Billed annually (${plan.annualPrice}/year)
                      </p>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-revtrack-text-secondary">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-center opacity-50">
                      <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-revtrack-text-light line-through">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <div className="mt-8">
                  <Link
                    href="/auth?mode=signup"
                    className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:shadow-lg hover:scale-105 focus:ring-purple-500'
                        : 'bg-gray-100 text-revtrack-text-primary hover:bg-gray-200 focus:ring-gray-500'
                    }`}
                  >
                    Start Free Trial
                  </Link>
                  <p className="text-center text-xs text-revtrack-text-light mt-2">
                    14-day free trial • No credit card required
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ section */}
        <div className={`mt-20 text-center transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-2xl font-bold text-revtrack-text-primary mb-8">Frequently Asked Questions</h3>
          <div className="grid max-w-4xl mx-auto grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div>
              <h4 className="font-semibold text-revtrack-text-primary mb-2">Can I change plans anytime?</h4>
              <p className="text-revtrack-text-secondary text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h4 className="font-semibold text-revtrack-text-primary mb-2">Is there a setup fee?</h4>
              <p className="text-revtrack-text-secondary text-sm">No setup fees. Start your free trial today and begin using VendorFlow immediately.</p>
            </div>
            <div>
              <h4 className="font-semibold text-revtrack-text-primary mb-2">What payment methods do you accept?</h4>
              <p className="text-revtrack-text-secondary text-sm">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
            </div>
            <div>
              <h4 className="font-semibold text-revtrack-text-primary mb-2">Do you offer custom enterprise solutions?</h4>
              <p className="text-revtrack-text-secondary text-sm">Yes, we offer custom pricing and features for large enterprises. Contact our sales team.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 