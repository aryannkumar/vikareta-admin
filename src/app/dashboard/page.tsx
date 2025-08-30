'use client';

import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  CubeIcon, 
  BanknotesIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  overview: {
    totalUsers: number;
    totalOrders: number;
    totalProducts: number;
    totalServices: number;
    totalRevenue: number;
    userGrowth: number;
  };
  recentOrders: any[];
  orderStats: any[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error?.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: dashboardData?.overview.totalUsers || 0,
      icon: UsersIcon,
      change: dashboardData?.overview.userGrowth || 0,
      changeType: 'increase',
      color: 'bg-blue-500'
    },
    {
      name: 'Total Orders',
      value: dashboardData?.overview.totalOrders || 0,
      icon: ShoppingBagIcon,
      change: 12,
      changeType: 'increase',
      color: 'bg-green-500'
    },
    {
      name: 'Products & Services',
      value: (dashboardData?.overview.totalProducts || 0) + (dashboardData?.overview.totalServices || 0),
      icon: CubeIcon,
      change: 8,
      changeType: 'increase',
      color: 'bg-purple-500'
    },
    {
      name: 'Total Revenue',
      value: `₹${(dashboardData?.overview.totalRevenue || 0).toLocaleString()}`,
      icon: BanknotesIcon,
      change: 15,
      changeType: 'increase',
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="admin-stat-card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.changeType === 'increase' ? (
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`ml-1 text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}%
              </span>
              <span className="ml-1 text-sm text-gray-500">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Chart */}
        <div className="admin-chart-container">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Distribution</h3>
          <div className="space-y-3">
            {dashboardData?.orderStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    stat.status === 'delivered' ? 'bg-green-500' :
                    stat.status === 'processing' ? 'bg-blue-500' :
                    stat.status === 'pending' ? 'bg-yellow-500' :
                    stat.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {stat.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{stat.count}</div>
                  <div className="text-xs text-gray-500">
                    ₹{stat.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="admin-chart-container">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {dashboardData?.recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    #{order.orderNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.buyer} → {order.seller}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{order.amount.toLocaleString()}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="admin-button admin-button-primary text-center">
            Add New Admin
          </button>
          <button className="admin-button admin-button-secondary text-center">
            View All Orders
          </button>
          <button className="admin-button admin-button-secondary text-center">
            Manage Categories
          </button>
          <button className="admin-button admin-button-secondary text-center">
            System Settings
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="admin-card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm text-gray-600">Database: Connected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm text-gray-600">API: Operational</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm text-gray-600">Storage: Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}