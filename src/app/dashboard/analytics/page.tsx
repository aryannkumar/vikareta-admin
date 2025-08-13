'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRfqs: number;
  };
  recent: {
    newUsers: number;
    newOrders: number;
  };
  timestamp: string;
}

interface ChartData {
  name: string;
  users: number;
  orders: number;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminApiClient.getAnalytics({
        period: selectedPeriod,
        metrics: ['users', 'orders', 'revenue', 'products']
      });
      
      if (response.data?.success) {
        setAnalytics(response.data.data);
        
        // Generate mock chart data for demonstration
        const mockChartData = generateMockChartData(selectedPeriod);
        setChartData(mockChartData);
        
        // Generate mock category data
        const mockCategoryData = [
          { name: 'Electronics', value: 35, color: '#8884d8' },
          { name: 'Clothing', value: 25, color: '#82ca9d' },
          { name: 'Home & Garden', value: 20, color: '#ffc658' },
          { name: 'Books', value: 12, color: '#ff7300' },
          { name: 'Sports', value: 8, color: '#00ff00' },
        ];
        setCategoryData(mockCategoryData);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load analytics');
      
      // Set default data
      setAnalytics({
        overview: {
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRfqs: 0,
        },
        recent: {
          newUsers: 0,
          newOrders: 0,
        },
        timestamp: new Date().toISOString(),
      });
      setChartData([]);
      setCategoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockChartData = (period: string): ChartData[] => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data: ChartData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: Math.floor(Math.random() * 100) + 20,
        orders: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 10000) + 2000,
      });
    }
    
    return data;
  };

  const handleExport = async () => {
    try {
      alert('Export functionality would be implemented here');
    } catch (error) {
      console.error('Failed to export analytics:', error);
      alert('Failed to export analytics');
    }
  };

  const statCards = [
    {
      name: 'Total Users',
      value: analytics?.overview.totalUsers || 0,
      change: '+12%',
      changeType: 'increase' as const,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Products',
      value: analytics?.overview.totalProducts || 0,
      change: '+8%',
      changeType: 'increase' as const,
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'Total Orders',
      value: analytics?.overview.totalOrders || 0,
      change: '+15%',
      changeType: 'increase' as const,
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      name: 'Total RFQs',
      value: analytics?.overview.totalRfqs || 0,
      change: '-3%',
      changeType: 'decrease' as const,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ];

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Loading analytics...</p>
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
                <BarChart3 className="h-8 w-8 mr-3 text-indigo-600" />
                Platform Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive insights into platform performance
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
                </select>
              </div>
              <button
                onClick={fetchAnalytics}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchAnalytics}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${card.color} rounded-md p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value.toLocaleString()}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {card.changeType === 'increase' ? (
                            <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                          ) : (
                            <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                          )}
                          <span className="ml-1">
                            {card.change}
                          </span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Users & Orders Over Time */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Users & Orders Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="New Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bar Chart - Revenue */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Revenue Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="#ffc658" 
                    name="Revenue (₹)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie Chart - Category Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Product Categories
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">New Users</p>
                    <p className="text-xs text-blue-700">Last {selectedPeriod}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {analytics?.recent.newUsers || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">New Orders</p>
                    <p className="text-xs text-green-700">Last {selectedPeriod}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {analytics?.recent.newOrders || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-900">Active Products</p>
                    <p className="text-xs text-purple-700">Total count</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {analytics?.overview.totalProducts || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-900">Total RFQs</p>
                    <p className="text-xs text-yellow-700">All time</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {analytics?.overview.totalRfqs || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {analytics && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <p className="text-sm text-gray-600">
              Last updated: {new Date(analytics.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}