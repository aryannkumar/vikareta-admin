'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertTriangle,
  Download,
  Image as ImageIcon,
  MessageSquare,
  Flag,
  Clock
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { FilterOptions, PaginatedResponse } from '@/types';

interface ContentItem {
  id: string;
  type: 'product' | 'review' | 'message' | 'media' | 'profile';
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagReason?: string;
  rejectionReason?: string;
  reportCount: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  metadata?: {
    url?: string;
    mediaType?: string;
    category?: string;
    rating?: number;
  };
}

interface ContentFilters extends FilterOptions {
  type?: 'product' | 'review' | 'message' | 'media' | 'profile';
  reportCount?: number;
  reviewedBy?: string;
}

interface ModerationAction {
  id: string;
  contentId: string;
  action: 'approve' | 'reject' | 'flag' | 'remove';
  reason?: string;
  adminId: string;
  adminName: string;
  createdAt: string;
}

export default function ContentModerationPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState<ContentFilters>({
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
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([]);
  const [contentStats, setContentStats] = useState({
    totalContent: 0,
    pendingReview: 0,
    flaggedContent: 0,
    approvedToday: 0,
    rejectedToday: 0
  });

  useEffect(() => {
    fetchContentItems();
    fetchContentStats();
  }, [filters]);

  const fetchContentItems = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get('/content/moderation', { params: filters });
      const data: PaginatedResponse<ContentItem> = response.data;
      setContentItems(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch content items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContentStats = async () => {
    try {
      const response = await adminApiClient.get('/dashboard/content-stats');
      setContentStats(response.data);
    } catch (error) {
      console.error('Failed to fetch content stats:', error);
    }
  };

  const fetchModerationHistory = async (contentId: string) => {
    try {
      const response = await adminApiClient.get(`/content/${contentId}/moderation-history`);
      setModerationHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch moderation history:', error);
    }
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof ContentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleContentAction = async (contentId: string, action: 'approve' | 'reject' | 'flag' | 'remove', reason?: string) => {
    try {
      await adminApiClient.post(`/content/${contentId}/moderate`, {
        action,
        reason
      });
      fetchContentItems();
    } catch (error) {
      console.error(`Failed to ${action} content:`, error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'flag' | 'export') => {
    if (action === 'export') {
      const exportData = contentItems.filter(item => selectedItems.includes(item.id));
      const csv = convertToCSV(exportData);
      downloadCSV(csv, 'content-moderation-export.csv');
      return;
    }

    try {
      await Promise.all(
        selectedItems.map(contentId => handleContentAction(contentId, action))
      );
      setSelectedItems([]);
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
    }
  };

  const convertToCSV = (data: ContentItem[]) => {
    const headers = ['ID', 'Type', 'Title', 'Author', 'Status', 'Report Count', 'Created At'];
    const rows = data.map(item => [
      item.id,
      item.type,
      item.title,
      item.authorName,
      item.status,
      item.reportCount,
      new Date(item.createdAt).toLocaleDateString()
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

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      flagged: 'bg-orange-100 text-orange-800'
    };

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      flagged: Flag
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      product: FileText,
      review: MessageSquare,
      message: MessageSquare,
      media: ImageIcon,
      profile: FileText
    };

    return icons[type as keyof typeof icons] || FileText;
  };

  const openContentModal = async (content: ContentItem) => {
    setSelectedContent(content);
    setShowContentModal(true);
    await fetchModerationHistory(content.id);
  };

  const handleRejectContent = (content: ContentItem) => {
    setSelectedContent(content);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (selectedContent && rejectReason.trim()) {
      await handleContentAction(selectedContent.id, 'reject', rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedContent(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-gray-600">Review and moderate user-generated content across the platform</p>
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Content</dt>
                  <dd className="text-lg font-medium text-gray-900">{contentStats.totalContent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                  <dd className="text-lg font-medium text-gray-900">{contentStats.pendingReview}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Flag className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Flagged</dt>
                  <dd className="text-lg font-medium text-gray-900">{contentStats.flaggedContent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{contentStats.approvedToday}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{contentStats.rejectedToday}</dd>
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
              placeholder="Search content by title, author, or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              >
                <option value="">All Types</option>
                <option value="product">Product</option>
                <option value="review">Review</option>
                <option value="message">Message</option>
                <option value="media">Media</option>
                <option value="profile">Profile</option>
              </select>

              <input
                type="number"
                placeholder="Min Reports"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.reportCount || ''}
                onChange={(e) => handleFilterChange('reportCount', e.target.value ? Number(e.target.value) : undefined)}
              />

              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-700">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('flag')}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
              >
                Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedItems.length === contentItems.length && contentItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(contentItems.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('reportCount')}
                >
                  Reports
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
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
              ) : contentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No content found
                  </td>
                </tr>
              ) : (
                contentItems.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TypeIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 capitalize">{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                          <div className="text-sm text-gray-500 truncate">{item.content}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.authorName}</div>
                          <div className="text-sm text-gray-500">{item.authorEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${item.reportCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.reportCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openContentModal(item)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleContentAction(item.id, 'approve')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectContent(item)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {item.reportCount > 0 && (
                            <button
                              onClick={() => handleContentAction(item.id, 'flag')}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Content Detail Modal */}
      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Content Details - {selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
              </h3>
              <button
                onClick={() => setShowContentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Information */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Content Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {selectedContent.title}</div>
                    <div><span className="font-medium">Type:</span> {selectedContent.type}</div>
                    <div><span className="font-medium">Author:</span> {selectedContent.authorName} ({selectedContent.authorEmail})</div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedContent.status)}</div>
                    <div><span className="font-medium">Reports:</span> {selectedContent.reportCount}</div>
                    <div><span className="font-medium">Created:</span> {new Date(selectedContent.createdAt).toLocaleString()}</div>
                    {selectedContent.reviewedAt && (
                      <div><span className="font-medium">Reviewed:</span> {new Date(selectedContent.reviewedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedContent.content}</p>
                </div>

                {selectedContent.metadata?.url && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Media</h4>
                    {selectedContent.metadata.mediaType === 'image' ? (
                      <img 
                        src={selectedContent.metadata.url} 
                        alt="Content media" 
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <a 
                        href={selectedContent.metadata.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        View Media
                      </a>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {selectedContent.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleContentAction(selectedContent.id, 'approve')}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectContent(selectedContent)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleContentAction(selectedContent.id, 'flag')}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                  >
                    Flag Content
                  </button>
                </div>
              </div>

              {/* Moderation History */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Moderation History</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
                  {moderationHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">No moderation history</p>
                  ) : (
                    <div className="space-y-3">
                      {moderationHistory.map((action) => (
                        <div key={action.id} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {action.action.charAt(0).toUpperCase() + action.action.slice(1)}
                              </div>
                              <div className="text-sm text-gray-500">by {action.adminName}</div>
                              {action.reason && (
                                <div className="text-sm text-gray-700 mt-1">{action.reason}</div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(action.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Content</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Please provide a reason for rejecting this content:
                </p>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}