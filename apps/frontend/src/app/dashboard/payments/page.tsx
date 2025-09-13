'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { paymentsApi, vendorsApi } from '@/lib/api'
import { PaymentTransaction, Vendor, PaymentStatus, PaymentMethod, PaymentType } from '@/types'

export default function PaymentsOverview() {
  const [activeTab, setActiveTab] = useState('payments')
  const [payments, setPayments] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useRealStripeData, setUseRealStripeData] = useState(false)
  const [realStripePayments, setRealStripePayments] = useState<any[]>([])

  useEffect(() => {
    if (useRealStripeData) {
      loadRealStripePayments()
    } else {
      loadPayments()
    }
    loadVendors()
  }, [useRealStripeData])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentsApi.getAllTransactions()
      if (response.data) {
        // Handle nested response structure
        const data = response.data as any
        if (Array.isArray(data)) {
          setPayments(data)
        } else if (data.transactions && Array.isArray(data.transactions)) {
          setPayments(data.transactions)
        } else {
          setPayments([])
        }
      }
    } catch (error) {
      console.error('Error loading payments:', error)
      setPayments([]) // Ensure payments is always an array
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await vendorsApi.getAll()
      if (response.data && Array.isArray(response.data)) {
        setVendors(response.data)
      } else if (response.data && typeof response.data === 'object' && 'vendors' in response.data) {
        setVendors((response.data as any).vendors || [])
      }
    } catch (error) {
      console.error('Error loading vendors:', error)
    }
  }

  const loadRealStripePayments = async () => {
    try {
      setLoading(true)
      const response = await paymentsApi.getRealStripeTransactions(20)
      if (response.data) {
        setRealStripePayments(response.data)
      }
    } catch (error) {
      console.error('Error loading real Stripe payments:', error)
      setRealStripePayments([])
    } finally {
      setLoading(false)
    }
  }

  const createRealStripePayment = async (amount: number, description?: string) => {
    try {
      setIsSubmitting(true)
      const response = await paymentsApi.createRealStripePayment({
        amount,
        currency: 'usd',
        description: description || 'VendorFlow Payment'
      })
      
      if (response.data) {
        if (useRealStripeData) {
          loadRealStripePayments()
        } else {
          loadPayments()
        }
        setIsAddModalOpen(false)
        alert('Real Stripe payment created successfully!')
      }
    } catch (error) {
      console.error('Error creating real Stripe payment:', error)
      alert('Failed to create real Stripe payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const syncAllPayments = async () => {
    try {
      setLoading(true)
      const promises = payments
        .filter(p => p.stripePaymentIntentId && p.stripePaymentIntentId.startsWith('pi_'))
        .map(p => paymentsApi.syncPaymentWithStripe(p.transactionId))
      
      await Promise.all(promises)
      loadPayments()
      alert('Payment statuses synced with Stripe!')
    } catch (error) {
      console.error('Error syncing payments:', error)
      alert('Failed to sync payments with Stripe.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      case 'refunded':
        return 'bg-purple-100 text-purple-800'
      case 'partially_refunded':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Add Payment Modal Component
  const AddPaymentModal = ({ isOpen, onClose, vendors, onPaymentAdded, isSubmitting, setIsSubmitting }: {
    isOpen: boolean;
    onClose: () => void;
    vendors: Vendor[];
    onPaymentAdded: () => void;
    isSubmitting: boolean;
    setIsSubmitting: (value: boolean) => void;
  }) => {
    const [formData, setFormData] = useState<Partial<PaymentTransaction>>({
      vendorId: '',
      transactionId: `TXN-${Date.now()}`,
      stripePaymentIntentId: '',
      amount: undefined,
      currency: 'USD',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.CARD,
      paymentType: PaymentType.ONE_TIME,
      description: undefined,
      customerEmail: undefined,
      customerName: undefined
    })

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.vendorId || !formData.amount || !formData.transactionId) {
        alert('Please fill in all required fields')
        return
      }

      try {
        setIsSubmitting(true)
        const paymentData: PaymentTransaction = {
          vendorId: formData.vendorId!,
          transactionId: formData.transactionId!,
          stripePaymentIntentId: formData.stripePaymentIntentId || `pi_${Date.now()}`,
          amount: formData.amount!,
          currency: formData.currency!,
          status: formData.status!,
          paymentMethod: formData.paymentMethod!,
          paymentType: formData.paymentType!,
          ...(formData.description && { description: formData.description }),
          ...(formData.customerEmail && { customerEmail: formData.customerEmail }),
          ...(formData.customerName && { customerName: formData.customerName })
        }

        const response = await paymentsApi.createTransaction(paymentData)
        if (response.data) {
          // Reset form
          setFormData({
            vendorId: '',
            transactionId: `TXN-${Date.now()}`,
            stripePaymentIntentId: '',
            amount: undefined,
            currency: 'USD',
            status: 'pending',
            paymentMethod: 'card',
            paymentType: 'one_time',
            description: undefined,
            customerEmail: undefined,
            customerName: undefined
          })
          onPaymentAdded()
          onClose()
        } else if (response.error) {
          alert(`Error: ${response.error}`)
        }
      } catch (error) {
        console.error('Error creating payment:', error)
        alert('Failed to create payment. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name} ({vendor.vendorCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TXN-123456"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Payment description..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments Overview</h1>
            <p className="text-gray-600 mt-1">Track and manage your payment transactions</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            Add Payment
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          </div>
          
          {/* Mobile Card Layout */}
          <div className="block sm:hidden">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No payments found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <div key={payment._id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {payment.transactionId}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payment.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <AddPaymentModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          vendors={vendors}
          onPaymentAdded={loadPayments}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      )}
    </DashboardLayout>
  )
}
