'use client';

import { useEffect, useState } from 'react';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';
import {
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  ChartBarIcon,
  ChartPieIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminApiClient } from '@/lib/api/admin-client';

interface ReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    revenueChange: number;
    ordersChange: number;
    productsChange: number;
    usersChange: number;
  };
  charts: {
    revenue: Array<{ date: string; value: number }>;
    orders: Array<{ date: string; value: number }>;
    users: Array<{ date: string; value: number }>;
  };
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
  topCategories: Array<{
    name: string;
    revenue: number;
    percentage: number;
  }>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedReportType, setSelectedReportType] = useState('overview');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, selectedReportType]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminApiClient.get('/reports/overview', {
        params: {
          period: selectedPeriod,
          type: selectedReportType
        }
      });

      if (response.data?.success) {
        setReportData(response.data.data);
      } else {
        throw new Error('Failed to fetch report data');
      }
    } catch (error: any) {
      console.error('Failed to fetch report data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load report data');

      // Set mock data for demonstration
      setReportData({
        summary: {
          totalRevenue: 125000,
          totalOrders: 1250,
          totalProducts: 450,
          totalUsers: 3200,
          revenueChange: 12.5,
          ordersChange: 8.3,
          productsChange: 15.2,
          usersChange: 22.1
        },
        charts: {
          revenue: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 10000) + 2000
          })),
          orders: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 50) + 10
          })),
          users: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 20) + 5
          }))
        },
        topProducts: [
          { id: '1', name: 'Premium Laptop', revenue: 25000, orders: 25 },
          { id: '2', name: 'Wireless Headphones', revenue: 18000, orders: 45 },
          { id: '3', name: 'Smart Watch', revenue: 15000, orders: 30 },
          { id: '4', name: 'Gaming Mouse', revenue: 12000, orders: 60 },
          { id: '5', name: 'Mechanical Keyboard', revenue: 10000, orders: 40 }
        ],
        topCategories: [
          { name: 'Electronics', revenue: 45000, percentage: 36 },
          { name: 'Clothing', revenue: 28000, percentage: 22 },
          { name: 'Home & Garden', revenue: 22000, percentage: 18 },
          { name: 'Books', revenue: 15000, percentage: 12 },
          { name: 'Sports', revenue: 15000, percentage: 12 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setIsGeneratingReport(true);

      const response = await adminApiClient.generateReport({
        format,
        includeCharts: true,
        includeRawData: true,
        sections: ['summary', 'charts', 'topProducts', 'topCategories'],
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        },
        selectedMetrics: ['revenue', 'orders', 'products', 'users'],
        data: reportData
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vikareta-report-${selectedPeriod}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-indigo-600" />
                Reports & Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive business reports and insights
              </p>
            </div>
            <div className="flex space-x-3">
              <div className="flex items-center space-x-2">
                <label htmlFor="period" className="text-sm font-medium text-gray-700">
                  Period:
                </label>
                <select
                  id="period"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              <button
                onClick={fetchReportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <div className="relative">
                <button
                  onClick={() => {}}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                  <div className="py-1">
                    <button
                      onClick={() => handleExportReport('pdf')}
                      disabled={isGeneratingReport}
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExportReport('excel')}
                      disabled={isGeneratingReport}
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={() => handleExportReport('csv')}
                      disabled={isGeneratingReport}
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Export as CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Reports</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchReportData}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(reportData.summary.totalRevenue)}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        reportData.summary.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {reportData.summary.revenueChange >= 0 ? (
                          <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {Math.abs(reportData.summary.revenueChange)}%
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBagIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatNumber(reportData.summary.totalOrders)}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        reportData.summary.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {reportData.summary.ordersChange >= 0 ? (
                          <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {Math.abs(reportData.summary.ordersChange)}%
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Products
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatNumber(reportData.summary.totalProducts)}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        reportData.summary.productsChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {reportData.summary.productsChange >= 0 ? (
                          <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {Math.abs(reportData.summary.productsChange)}%
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatNumber(reportData.summary.totalUsers)}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        reportData.summary.usersChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {reportData.summary.usersChange >= 0 ? (
                          <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {Math.abs(reportData.summary.usersChange)}%
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Revenue Trend
            </h3>
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Revenue chart visualization</p>
                <p className="text-sm">Chart component would be rendered here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <ChartPieIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Revenue by Category
            </h3>
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChartPieIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Pie chart visualization</p>
                <p className="text-sm">Chart component would be rendered here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Top Performing Products
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Order Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.topProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-indigo-700">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.orders)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.revenue / product.orders)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Category Performance
          </h3>
          <div className="space-y-4">
            {reportData?.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-700">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(category.revenue)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {category.percentage}%
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}