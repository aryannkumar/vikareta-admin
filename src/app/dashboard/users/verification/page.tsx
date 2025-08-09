'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  AlertTriangle,
  Download,
  FileText
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { User, FilterOptions, PaginatedResponse } from '@/types';

interface VerificationFilters extends FilterOptions {
  verificationTier?: 'basic' | 'standard' | 'enhanced' | 'premium';
  documentType?: 'pan' | 'aadhaar' | 'gst' | 'business_license';
}

export default function UserVerificationPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<VerificationFilters>({
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
    fetchPendingVerifications();
  }, [filters]);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      // Fetch users with pending verification status
      const response = await adminApiClient.getUsers({
        ...filters,
        status: 'pending_verification' // Only get users pending verification
      });
      const data: PaginatedResponse<User> = response.data.data;
      setUsers(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof VerificationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleVerificationAction = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (action === 'approve') {
        await adminApiClient.verifyUser(userId, { verified: true });
      } else {
        await adminApiClient.verifyUser(userId, { verified: false, rejectionReason: reason });
      }
      fetchPendingVerifications();
    } catch (error) {
      console.error(`Failed to ${action} verification:`, error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'export') => {
    if (action === 'export') {
      const exportData = users.filter(user => selectedUsers.includes(user.id));
      const csv = convertToCSV(exportData);
      downloadCSV(csv, 'pending-verifications.csv');
      return;
    }

    try {
      await Promise.all(
        selectedUsers.map(userId => handleVerificationAction(userId, action))
      );
      setSelectedUsers([]);
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
    }
  };

  const convertToCSV = (data: User[]) => {
    const headers = ['ID', 'Name', 'Email', 'Business Name', 'Verification Tier', 'Submitted At'];
    const rows = data.map(user => [
      user.id,
      `${user.firstName} ${user.lastName}`,
      user.email,
      user.businessName || '',
      user.verificationTier,
      new Date(user.createdAt).toLocaleDateString()
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

  const getVerificationBadge = (tier: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      enhanced: 'bg-green-100 text-green-800',
      premium: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tier as keyof typeof colors]}`}>
        <Clock className="w-3 h-3 mr-1" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)} Pending
      </span>
    );
  };

  const getPriorityBadge = (tier: string) => {
    const priority = tier === 'premium' ? 'high' : tier === 'enhanced' ? 'medium' : 'low';
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
          <p className="text-gray-600">Review and process user verification requests</p>
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
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
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
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Priority</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => u.verificationTier === 'premium').length}
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
                <FileText className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Documents</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.reduce((acc, u) => acc + (u.documents?.length || 0), 0)}
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
              placeholder="Search by name, email, or business name..."
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
                value={filters.verificationTier || ''}
                onChange={(e) => handleFilterChange('verificationTier', e.target.value || undefined)}
              >
                <option value="">All Verification Tiers</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="enhanced">Enhanced</option>
                <option value="premium">Premium</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.documentType || ''}
                onChange={(e) => handleFilterChange('documentType', e.target.value || undefined)}
              >
                <option value="">All Document Types</option>
                <option value="pan">PAN Card</option>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="gst">GST Certificate</option>
                <option value="business_license">Business License</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.sortBy || ''}
                onChange={(e) => handleFilterChange('sortBy', e.target.value || 'createdAt')}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="verificationTier">Sort by Priority</option>
                <option value="firstName">Sort by Name</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-700">
              {selectedUsers.length} verification{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Approve All
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Queue Table */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <p>No pending verifications</p>
                      <p className="text-sm">All verification requests have been processed</p>
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
                          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-yellow-600" />
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
                      {getVerificationBadge(user.verificationTier)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(user.verificationTier)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {user.documents?.length || 0} files
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
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
                          onClick={() => handleVerificationAction(user.id, 'approve')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVerificationAction(user.id, 'reject')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
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