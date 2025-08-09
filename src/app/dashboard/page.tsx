'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { useAuth } from '@/components/providers/auth-provider';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'product_approval' | 'order_placed' | 'dispute_raised';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const [statsResponse, activityResponse] = await Promise.all([
        adminApiClient.get('/dashboard/stats'),
        adminApiClient.get('/dashboard/activity')
      ]);
      
      console.log('Stats response:', statsResponse.data);
      console.log('Activity response:', activityResponse.data);
      
      // Ensure we have valid data before setting state
      const statsData = statsResponse.data?.data;
      const activityData = activityResponse.data?.data;
      
      if (statsData) {
        setStats(statsData);
      } else {
        console.warn('No stats data received, using defaults');
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalProducts: 0,
          pendingProducts: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          userGrowth: 0,
          revenueGrowth: 0,
        });
      }
      
      if (Array.isArray(activityData)) {
        setRecentActivity(activityData);
      } else {
        console.warn('No activity data received, using empty array');
        setRecentActivity([]);
      }
      
      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set some default data so the dashboard shows something
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalProducts: 0,
        pendingProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        userGrowth: 0,
        revenueGrowth: 0,
      });
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers ?? 0,
      change: stats?.userGrowth ?? 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Products',
      value: stats?.totalProducts ?? 0,
      change: 0,
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      change: 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      name: 'Monthly Revenue',
      value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString()}`,
      change: stats?.revenueGrowth ?? 0,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return Users;
      case 'product_approval':
        return Package;
      case 'order_placed':
        return ShoppingCart;
      case 'dispute_raised':
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p><strong>Debug Info:</strong></p>
        <p>User: {user?.firstName} {user?.lastName} ({user?.email})</p>
        <p>Stats loaded: {stats ? 'Yes' : 'No'}</p>
        <p>Activity loaded: {recentActivity ? `${recentActivity.length} items` : 'No'}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      </div>

      {/* Welcome Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your platform today.
          </p>
        </div>
      </div>

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
                          {card.value}
                        </div>
                        {card.change !== 0 && (
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            card.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {card.change > 0 ? (
                              <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                            ) : (
                              <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                            )}
                            <span className="ml-1">
                              {Math.abs(card.change)}%
                            </span>
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Users className="h-5 w-5 mr-2" />
                Verify Users
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Package className="h-5 w-5 mr-2" />
                Review Products
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Handle Disputes
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                <CreditCard className="h-5 w-5 mr-2" />
                Review Transactions
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== recentActivity.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.status)}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats && (stats.pendingProducts > 0 || stats.pendingOrders > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Attention Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {stats.pendingProducts > 0 && (
                    <li>{stats.pendingProducts} products awaiting approval</li>
                  )}
                  {stats.pendingOrders > 0 && (
                    <li>{stats.pendingOrders} orders require attention</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}