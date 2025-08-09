'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  Shield,
  Download,
  RotateCcw
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { User, FilterOptions, PaginatedResponse } from '@/types';

interface SuspendedFilters extends FilterOptions {
  suspensionReason?: string;
  suspendedBy?: string;
}

export default function SuspendedUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<SuspendedFilters>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSuspendedUsers();
  }, [filters]);

  const fetchSuspendedUsers = async () => {
    try {
      setLoading(true);
      // Fetch users with suspended status
      const response = await adminApiClient.getUsers({
        ...filters,
        status: 'suspended' // Only get suspended users
      });
      const data: PaginatedResponse<User> = response.data.data;
      setUsers(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch suspended users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof SuspendedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleUserAction = async (userId: string, action: 'reactivate' | 'permanent_ban') => {
    try {
      if (action === 'reactivate') {
        await adminApiClient.updateUser(userId, { isActive: true });
      } else {
        await adminApiClient.updateUser(userId, { isActive: false, permanentBan: true });
      }
      fetchSuspendedUsers();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const handleBulkAction = async (action: 'reactivate' | 'permanent_ban' | 'export') => {
    if (action === 'export') {
      const exportData = users.filter(user => selectedUsers.includes(user.id));
      const csv = convertToCSV(exportData);
      downloadCSV(csv, 'suspended-users.csv');
      return;
    }

    try {
      await Promise.all(
        selectedUsers.map(userId => handleUserAction(userId, action))
      );
      setSelectedUsers([]);
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
    }
  };

  const convertToCSV = (data: User[]) => {
    const headers = ['ID', 'Name', 'Email', 'Business Name', 'Role', 'Suspended Date', 'Reason'];
    const rows = data.map(user => [
      user.id,
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.businessName || '',
      user.role,
      new Date(user.updatedAt).toLocaleDateString(),
      'Policy Violation' // Placeholder - you might want to add suspension reason to the user model
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSuspensionBadge = (user: User) => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Suspended
      </span>
    );
  };

  const getDaysSuspended = (updatedAt: string) => {
    const suspendedDate = new Date(updatedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - suspendedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suspended Users</h1>
          <p className="text-gray-600">Manage suspended user accounts and review reactivation requests</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => handleBulkAction('export')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Suspended</dt>
                  <dd className="text-lg font-medium text-gray-900">{pagination.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent (7 days)</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => getDaysSuspended(u.updatedAt) <= 7).length}
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
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Business Accounts</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => u.businessName).length}
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
                <RotateCcw className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Eligible for Review</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => getDaysSuspended(u.updatedAt) >= 30).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suspended users by name, email, or business name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.suspensionReason || ''}
                onChange={(e) => handleFilterChange('suspensionReason', e.target.value || undefined)}
              >
                <option value="">All Suspension Reasons</option>
                <option value="policy_violation">Policy Violation</option>
                <option value="fraud_suspicion">Fraud Suspicion</option>
                <option value="spam_activity">Spam Activity</option>
                <option value="payment_issues">Payment Issues</option>
                <option value="other">Other</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.sortBy || ''}
                onChange={(e) => handleFilterChange('sortBy', e.target.value || 'updatedAt')}
              >
                <option value="updatedAt">Sort by Suspension Date</option>
                <option value="firstName">Sort by Name</option>
                <option value="createdAt">Sort by Registration Date</option>
              </select>

              <input
                type="text"
                placeholder="Suspended by admin..."
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.suspendedBy || ''}
                onChange={(e) => handleFilterChange('suspendedBy', e.target.value || undefined)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-700">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('reactivate')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Reactivate
              </button>
              <button
                onClick={() => handleBulkAction('permanent_ban')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Permanent Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspended Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('firstName')}
                >
                  User
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suspension Reason
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updatedAt')}
                >
                  Suspended Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Suspended
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <p>No suspended users</p>
                      <p className="text-sm">All users are currently active</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.businessName && (
                            <div className="text-xs text-gray-400">{user.businessName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSuspensionBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Policy Violation</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getDaysSuspended(user.updatedAt) >= 30 ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                        {getDaysSuspended(user.updatedAt)} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'reactivate')}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivate"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'permanent_ban')}
                          className="text-red-600 hover:text-red-900"
                          title="Permanent Ban"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}