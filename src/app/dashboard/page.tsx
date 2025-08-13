'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  UserCheck,
  FileText,
  DollarSign
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

interface PendingProduct {
  id: string;
  title: string;
  seller: {
    firstName: string;
    lastName: string;
    email: string;
  };
  category: {
    name: string;
  };
  createdAt: string;
}

interface RecentTransaction {
  id: string;
  transactionType: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      
      const [
        statsResponse, 
        activityResponse, 
        pendingProductsResponse,
        transactionsResponse
      ] = await Promise.all([
        adminApiClient.get('/dashboard/stats'),
        adminApiClient.get('/dashboard/activity'),
        adminApiClient.get('/dashboard/products/pending'),
        adminApiClient.get('/dashboard/transactions')
      ]);
      
      console.log('Dashboard responses received');
      
      // Set stats
      if (statsResponse.data?.success && statsResponse.data?.data) {
        setStats(statsResponse.data.data);
      } else {
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
      
      // Set activity
      if (activityResponse.data?.success && Array.isArray(activityResponse.data?.data)) {
        setRecentActivity(activityResponse.data.data);
      } else {
        setRecentActivity([]);
      }
      
      // Set pending products
      if (pendingProductsResponse.data?.success && Array.isArray(pendingProductsResponse.data?.data)) {
        setPendingProducts(pendingProductsResponse.data.data);
      } else {
        setPendingProducts([]);
      }
      
      // Set transactions
      if (transactionsResponse.data?.success && Array.isArray(transactionsResponse.data?.data)) {
        setRecentTransactions(transactionsResponse.data.data);
      } else {
        setRecentTransactions([]);
      }
      
      console.log('Dashboard data loaded successfully');
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
      
      // Set default data
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
      setPendingProducts([]);
      setRecentTransactions([]);
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
      href: '/dashboard/users',
    },
    {
      name: 'Active Products',
      value: stats?.totalProducts ?? 0,
      change: 0,
      icon: Package,
      color: 'bg-green-500',
      href: '/dashboard/products',
    },
    {
      name: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      change: 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      href: '/dashboard/orders',
    },
    {
      name: 'Monthly Revenue',
      value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString()}`,
      change: stats?.revenueGrowth ?? 0,
      icon: CreditCard,
      color: 'bg-yellow-500',
      href: '/dashboard/transactions',
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
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchDashboardData}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <Link key={card.name} href={card.href}>
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
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
            </Link>
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
              <Link href="/dashboard/users/verification">
                <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Verify Users
                </button>
              </Link>
              <Link href="/dashboard/products">
                <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Package className="h-5 w-5 mr-2" />
                  Review Products
                </button>
              </Link>
              <Link href="/dashboard/disputes">
                <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Handle Disputes
                </button>
              </Link>
              <Link href="/dashboard/transactions">
                <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Review Transactions
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            {recentActivity.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.slice(0, 5).map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {index !== recentActivity.length - 1 && index !== 4 && (
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
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Products & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Products */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Pending Products
              </h3>
              <Link href="/dashboard/products" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
            {pendingProducts.length > 0 ? (
              <div className="space-y-3">
                {pendingProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {product.seller.firstName} {product.seller.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {product.category.name} • {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/dashboard/products/${product.id}`}>
                      <button className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending products</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Transactions
              </h3>
              <Link href="/dashboard/transactions" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.user.firstName} {transaction.user.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {transaction.transactionType} • {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent transactions</p>
            )}
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
                    <li>
                      <Link href="/dashboard/products" className="underline hover:no-underline">
                        {stats.pendingProducts} products awaiting approval
                      </Link>
                    </li>
                  )}
                  {stats.pendingOrders > 0 && (
                    <li>
                      <Link href="/dashboard/orders" className="underline hover:no-underline">
                        {stats.pendingOrders} orders require attention
                      </Link>
                    </li>
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