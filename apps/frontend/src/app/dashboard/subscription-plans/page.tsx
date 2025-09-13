'use client'

import { useState, useEffect } from 'react'
import { SupplierRoute } from '@/components/auth/RoleProtectedRoute'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { paymentsApi } from '@/lib/api'

export default function SubscriptionPlans() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState('standard')
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscribingToPlan, setSubscribingToPlan] = useState<string | null>(null)

  // Plans specifically designed for suppliers
  const plans = [
    {
      id: 'free_trial',
      name: 'Supplier Starter',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Perfect for small suppliers getting started',
      features: [
        'Up to 5 purchase orders per month',
        'Basic supplier profile',
        'Email notifications',
        '1 user account',
        'Basic order tracking',
        'Email support'
      ],
      limits: [
        'Orders: 5/month',
        'Storage: 1GB',
        'Users: 1'
      ],
      popular: false,
      color: 'gray'
    },
    {
      id: 'standard',
      name: 'Supplier Standard',
      monthlyPrice: 49,
      yearlyPrice: 490,
      description: 'Most popular for growing supplier businesses',
      features: [
        'Up to 100 purchase orders per month',
        'Advanced supplier dashboard',
        'Priority email support',
        'Up to 5 user accounts',
        'Advanced order analytics',
        'Inventory integration',
        'Bulk order processing',
        'API access'
      ],
      limits: [
        'Orders: 100/month',
        'Storage: 10GB',
        'Users: 5'
      ],
      popular: true,
      color: 'blue'
    },
    {
      id: 'premium',
      name: 'Supplier Enterprise',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      description: 'For large suppliers with complex needs',
      features: [
        'Unlimited purchase orders',
        'Enterprise supplier suite',
        '24/7 phone & email support',
        'Unlimited user accounts',
        'Custom reporting & analytics',
        'Advanced API access',
        'White-label options',
        'Dedicated account manager',
        'Custom integrations',
        'Priority processing'
      ],
      limits: [
        'Orders: Unlimited',
        'Storage: 100GB',
        'Users: Unlimited'
      ],
      popular: false,
      color: 'purple'
    }
  ]

  useEffect(() => {
    loadCurrentSubscription()
  }, [])

  const loadCurrentSubscription = async () => {
    try {
      setLoading(true)
      const response = await paymentsApi.getCurrentSubscription()
      
      if (response?.data) {
        setCurrentSubscription(response.data)
        setSelectedPlan(response.data.plan || 'standard')
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      // Don't show error for no subscription - this is normal for new users
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (plan: any) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  }

  const handleSubscribeToPlan = async (planId: string) => {
    if (subscribingToPlan) return // Prevent double clicks

    try {
      setSubscribingToPlan(planId)

      // For free plan, no Stripe checkout needed
      if (plans.find(p => p.id === planId)?.monthlyPrice === 0) {
        const response = await paymentsApi.createCheckoutSession(planId, billingPeriod)
        if (response?.data?.url) {
          // For free plan, redirect to success page
          window.location.href = response.data.url
        }
        return
      }

      // Create Stripe checkout session
      const response = await paymentsApi.createCheckoutSession(planId, billingPeriod)
      
      if (response?.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start subscription process. Please try again.')
    } finally {
      setSubscribingToPlan(null)
    }
  }

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan === planId && currentSubscription?.status === 'active'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Check URL parameters for success/cancel messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')
    
    if (success === 'true') {
      // Reload subscription data after successful payment
      loadCurrentSubscription()
      // Show success message
      alert('Subscription activated successfully!')
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/subscription-plans')
    } else if (canceled === 'true') {
      alert('Subscription process was cancelled.')
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/subscription-plans')
    }
  }, [])

  return (
    <SupplierRoute>
      <DashboardLayout title="Subscription Plans" description="Choose the perfect plan for your supplier business">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Supplier Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock powerful supplier tools to streamline your operations and grow your business
            </p>
          </div>

          {/* Current Subscription Status */}
          {!loading && currentSubscription && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Current Subscription</h3>
                  <p className="text-blue-700">
                    {plans.find(p => p.id === currentSubscription.plan)?.name || 'Unknown Plan'} - 
                    Status: {currentSubscription.status}
                  </p>
                  {currentSubscription.currentPeriodEnd && (
                    <p className="text-sm text-blue-600">
                      Next billing: {formatDate(currentSubscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">
                    ${currentSubscription.amount || 0}
                    <span className="text-sm font-normal">/{currentSubscription.billingPeriod || 'month'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Billing Period Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.popular
                    ? 'ring-2 ring-blue-500 transform scale-105'
                    : ''
                } ${isCurrentPlan(plan.id) ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan(plan.id) && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      ${getPrice(plan)}
                    </span>
                    <span className="text-gray-500">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  {billingPeriod === 'yearly' && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-green-600">
                      Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Plan Limits</h4>
                  <ul className="space-y-1">
                    {plan.limits.map((limit, index) => (
                      <li key={index} className="text-xs text-gray-500">{limit}</li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleSubscribeToPlan(plan.id)}
                  disabled={isCurrentPlan(plan.id) || subscribingToPlan === plan.id || loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isCurrentPlan(plan.id)
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : subscribingToPlan === plan.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan(plan.id)
                    ? 'Current Plan'
                    : subscribingToPlan === plan.id
                    ? 'Processing...'
                    : loading
                    ? 'Loading...'
                    : plan.monthlyPrice === 0
                    ? 'Start Free'
                    : 'Subscribe'
                  }
                </button>
              </div>
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <div className="text-center text-gray-600">
            <p className="mb-2">All plans include SSL security, 99.9% uptime guarantee, and email support.</p>
            <p className="text-sm">
              Need a custom plan? <a href="mailto:support@vendorflow.com" className="text-blue-600 hover:underline">Contact our sales team</a>
            </p>
          </div>
        </div>
      </DashboardLayout>
    </SupplierRoute>
  )
} 