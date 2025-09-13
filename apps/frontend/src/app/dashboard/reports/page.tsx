'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/ui/DashboardLayout'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const reportTypes = [
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Comprehensive sales analytics and performance metrics',
      icon: '📊',
      category: 'Financial'
    },
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Stock levels, turnover rates, and inventory analytics',
      icon: '📦',
      category: 'Operations'
    },
    {
      id: 'vendor',
      title: 'Vendor Performance',
      description: 'Vendor reliability, delivery times, and quality metrics',
      icon: '🤝',
      category: 'Partners'
    },
    {
      id: 'financial',
      title: 'Financial Summary',
      description: 'Revenue, expenses, profit margins, and financial health',
      icon: '💰',
      category: 'Financial'
    },
    {
      id: 'orders',
      title: 'Orders Analysis',
      description: 'Order trends, fulfillment rates, and customer insights',
      icon: '📋',
      category: 'Operations'
    },
    {
      id: 'forecasting',
      title: 'Demand Forecasting',
      description: 'Predictive analytics and future demand projections',
      icon: '🔮',
      category: 'Analytics'
    }
  ]

  const categories = ['All', 'Financial', 'Operations', 'Partners', 'Analytics']
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredReports = selectedCategory === 'All' 
    ? reportTypes 
    : reportTypes.filter(report => report.category === selectedCategory)

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      alert('Please select a report type')
      return
    }

    setIsGenerating(true)
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
      alert(`${reportTypes.find(r => r.id === selectedReport)?.title} generated successfully!`)
    }, 2000)
  }

  const handleExportReport = (format: string) => {
    alert(`Exporting report in ${format.toUpperCase()} format...`)
  }

  return (
    <DashboardLayout title="Reports & Analytics" description="Generate comprehensive business reports and analytics">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-semibold text-gray-900">247</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">32</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Automated</p>
                <p className="text-2xl font-semibold text-gray-900">18</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Generator */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Generate New Report</h2>
            <p className="text-sm text-gray-600 mt-1">Select report type and configure parameters</p>
          </div>
          
          <div className="p-6">
            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Types Grid */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Report Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedReport === report.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{report.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                          report.category === 'Financial' ? 'bg-green-100 text-green-700' :
                          report.category === 'Operations' ? 'bg-blue-100 text-blue-700' :
                          report.category === 'Partners' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {report.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </span>
                ) : (
                  'Generate Report'
                )}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportReport('pdf')}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handleExportReport('excel')}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
            <p className="text-sm text-gray-600 mt-1">Your recently generated reports</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { name: 'Q3 Sales Performance', type: 'Sales', date: '2024-09-08', status: 'Ready' },
                  { name: 'Inventory Analysis', type: 'Inventory', date: '2024-09-07', status: 'Ready' },
                  { name: 'Vendor Performance Review', type: 'Vendor', date: '2024-09-06', status: 'Processing' },
                  { name: 'Financial Summary', type: 'Financial', date: '2024-09-05', status: 'Ready' }
                ].map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-600">📄</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Download</button>
                      <button className="text-gray-600 hover:text-gray-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 