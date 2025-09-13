'use client'

import { useState, useEffect } from 'react'
import { VendorRoute } from '@/components/auth/RoleProtectedRoute'
import { DashboardLayout } from '@/components/ui/DashboardLayout'

export default function VendorPaymentsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Payment data state
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    thisMonth: 0,
    thisYear: 0,
    nextPayoutDate: '2025-10-01'
  })

  const [transactions, setTransactions] = useState([])
  const [transactionsPagination, setTransactionsPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  })

  const loadPaymentData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Fetch payment dashboard data
      const paymentsResponse = await fetch('http://localhost:3004/api/vendors/payments', { headers })
      console.log('Payment data response status:', paymentsResponse.status)
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        console.log('Payment data:', paymentsData)
        setEarningsData(paymentsData)
      }

      // Fetch payment transactions
      const transactionsResponse = await fetch('http://localhost:3004/api/vendors/payments/transactions?page=1&limit=20', { headers })
      console.log('Transactions response status:', transactionsResponse.status)
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        console.log('Transactions data:', transactionsData)
        setTransactions(transactionsData.transactions || [])
        setTransactionsPagination(transactionsData.pagination || {})
      }

    } catch (err) {
      console.error('Error loading payment data:', err)
      setError('Failed to load payment data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Export payment report as CSV
  const exportReport = () => {
    try {
      // Create CSV content
      const headers = ['Date', 'Transaction ID', 'Order Number', 'Customer', 'Amount', 'Status', 'Payout Status', 'Products']
      
      let csvContent = headers.join(',') + '\n'
      
      // Add transaction data
      transactions.forEach(transaction => {
        const row = [
          transaction.date,
          transaction.id,
          transaction.orderNumber,
          `"${transaction.customer}"`, // Quoted to handle commas in names
          transaction.amount.toFixed(2),
          transaction.status,
          transaction.payoutStatus,
          `"${transaction.products.join('; ')}"` // Quoted to handle commas in product names
        ]
        csvContent += row.join(',') + '\n'
      })
      
      // Add summary section
      csvContent += '\n'
      csvContent += 'SUMMARY\n'
      csvContent += `Total Earnings,${earningsData.totalEarnings.toFixed(2)}\n`
      csvContent += `Pending Payouts,${earningsData.pendingPayouts.toFixed(2)}\n`
      csvContent += `This Month,${earningsData.thisMonth.toFixed(2)}\n`
      csvContent += `This Year,${earningsData.thisYear.toFixed(2)}\n`
      csvContent += `Next Payout Date,${earningsData.nextPayoutDate}\n`
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `payment-report-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      console.log('Payment report exported successfully')
    } catch (error) {
      console.error('Error exporting report:', error)
      setError('Failed to export report. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refunded':
        return 'bg-red-100 text-red-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reversed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <VendorRoute>
        <DashboardLayout title="Payments" description="Track your earnings and payment history">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </DashboardLayout>
      </VendorRoute>
    )
  }

  if (error) {
    return (
      <VendorRoute>
        <DashboardLayout title="Payments" description="Track your earnings and payment history">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Payment Data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadPaymentData}
                    className="bg-red-100 px-2 py-1 text-sm text-red-800 rounded hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </VendorRoute>
    )
  }

  return (
    <VendorRoute>
      <DashboardLayout title="Payments" description="Monitor your earnings, track transactions, and manage payouts">
        <div className="space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="mt-4 sm:mt-0">
              <button 
                onClick={exportReport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
              </button>
            </div>
          </div>

          {/* Earnings Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Earnings */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                      <dd className="text-2xl font-bold text-gray-900">${earningsData.totalEarnings.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Payout */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Payout</dt>
                      <dd className="text-2xl font-bold text-gray-900">${earningsData.pendingPayouts.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                      <dd className="text-2xl font-bold text-gray-900">${earningsData.thisMonth.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Payout */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Next Payout</dt>
                      <dd className="text-lg font-bold text-gray-900">{earningsData.nextPayoutDate}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">This Month</p>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Once you start receiving orders, your payment transactions will appear here.
                </p>
              </div>
            ) : (
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{transaction.orderNumber}</div>
                              <div className="text-sm text-gray-500">{transaction.products.join(', ')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPayoutStatusColor(transaction.payoutStatus)}`}>
                              {transaction.payoutStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </VendorRoute>
  )
} 