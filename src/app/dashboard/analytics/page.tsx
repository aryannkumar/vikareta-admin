'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { AnalyticsData } from '@/types';
import { MetricsCard } from '@/components/analytics/metrics-card';
import { ChartContainer } from '@/components/analytics/chart-container';
import { ReportGenerator } from '@/components/analytics/report-generator';
import { DateRangePicker } from '@/components/analytics/date-range-picker';
import { MetricsFilter } from '@/components/analytics/metrics-filter';
import { MonitoringDashboard } from '@/components/analytics/monitoring-dashboard';

interface AnalyticsPageState {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  selectedPeriod: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  selectedMetrics: string[];
}

export default function AnalyticsPage() {
  const [state, setState] = useState<AnalyticsPageState>({
    data: null,
    isLoading: true,
    error: null,
    selectedPeriod: '30d',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    selectedMetrics: ['users', 'orders', 'revenue', 'products']
  });

  const fetchAnalyticsData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await adminApiClient.getAnalytics({
        period: state.selectedPeriod,
        metrics: state.selectedMetrics,
        dateFrom: state.dateRange.from.toISOString(),
        dateTo: state.dateRange.to.toISOString()
      });
      
      setState(prev => ({ 
        ...prev, 
        data: response.data, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load analytics data', 
        isLoading: false 
      }));
    }
  }, [state.selectedPeriod, state.selectedMetrics, state.dateRange.from, state.dateRange.to]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handlePeriodChange = (period: string) => {
    setState(prev => ({ ...prev, selectedPeriod: period }));
  };

  const handleDateRangeChange = (from: Date, to: Date) => {
    setState(prev => ({ 
      ...prev, 
      dateRange: { from, to },
      selectedPeriod: 'custom'
    }));
  };

  const handleMetricsChange = (metrics: string[]) => {
    setState(prev => ({ ...prev, selectedMetrics: metrics }));
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{state.error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={handleRefresh}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data } = state;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive platform analytics and business intelligence
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <ReportGenerator 
            data={data}
            dateRange={state.dateRange}
            selectedMetrics={state.selectedMetrics}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <select
              value={state.selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {state.selectedPeriod === 'custom' && (
            <DateRangePicker
              from={state.dateRange.from}
              to={state.dateRange.to}
              onChange={handleDateRangeChange}
            />
          )}

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Metrics:</span>
            <MetricsFilter
              selectedMetrics={state.selectedMetrics}
              onChange={handleMetricsChange}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Users"
          value={data.metrics.totalUsers}
          change={data.trends.userGrowth}
          icon={Users}
          color="blue"
          subtitle={`${data.metrics.activeUsers} active`}
        />
        <MetricsCard
          title="Total Orders"
          value={data.metrics.totalOrders}
          change={data.trends.orderGrowth}
          icon={ShoppingCart}
          color="green"
          subtitle={`${data.metrics.completedOrders} completed`}
        />
        <MetricsCard
          title="Total Revenue"
          value={`₹${data.metrics.totalRevenue.toLocaleString()}`}
          change={data.trends.revenueGrowth}
          icon={CreditCard}
          color="purple"
          subtitle={`₹${data.metrics.averageOrderValue.toLocaleString()} avg order`}
        />
        <MetricsCard
          title="Active Products"
          value={data.metrics.activeProducts}
          change={0}
          icon={Package}
          color="yellow"
          subtitle={`${data.metrics.totalProducts} total`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="User Growth"
          subtitle="New user registrations over time"
          data={data.charts.userRegistrations}
          type="line"
          color="blue"
        />
        <ChartContainer
          title="Order Volume"
          subtitle="Orders placed over time"
          data={data.charts.orderVolume}
          type="bar"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartContainer
          title="Revenue Trends"
          subtitle="Platform revenue and commission over time"
          data={data.charts.revenue}
          type="area"
          color="purple"
          showComparison={true}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {/* This would be populated with actual category data */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Electronics</span>
              <span className="text-sm font-medium">₹2,45,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fashion</span>
              <span className="text-sm font-medium">₹1,89,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Home & Garden</span>
              <span className="text-sm font-medium">₹1,56,000</span>
            </div>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Sellers</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">TechCorp Solutions</span>
              <span className="text-sm font-medium">₹89,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fashion Hub</span>
              <span className="text-sm font-medium">₹67,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Home Essentials</span>
              <span className="text-sm font-medium">₹54,000</span>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Regions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Maharashtra</span>
              <span className="text-sm font-medium">28%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Karnataka</span>
              <span className="text-sm font-medium">22%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tamil Nadu</span>
              <span className="text-sm font-medium">18%</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Monitoring Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">System Monitoring</h2>
        <MonitoringDashboard />
      </div>
    </div>
  );
}