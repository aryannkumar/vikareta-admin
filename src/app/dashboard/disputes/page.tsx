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
  MessageSquare,
  Clock,
  User,
  FileText,
  Send
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { Dispute, Order, User as UserType, FilterOptions, PaginatedResponse } from '@/types';

interface DisputeFilters extends FilterOptions {
  raisedBy?: 'buyer' | 'seller';
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderType: 'admin' | 'buyer' | 'seller';
  message: string;
  attachments?: string[];
  createdAt: string;
  sender?: UserType;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisputes, setSelectedDisputes] = useState<string[]>([]);
  const [filters, setFilters] = useState<DisputeFilters>({
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
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMessages, setDisputeMessages] = useState<DisputeMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [resolution, setResolution] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [disputeStats, setDisputeStats] = useState({
    totalDisputes: 0,
    openDisputes: 0,
    investigatingDisputes: 0,
    resolvedDisputes: 0,
    avgResolutionTime: 0
  });

  useEffect(() => {
    fetchDisputes();
    fetchDisputeStats();
  }, [filters]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get('/disputes', { params: filters });
      const data: PaginatedResponse<Dispute> = response.data;
      setDisputes(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeStats = async () => {
    try {
      const response = await adminApiClient.get('/dashboard/dispute-stats');
      setDisputeStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dispute stats:', error);
    }
  };

  const fetchDisputeMessages = async (disputeId: string) => {
    try {
      const response = await adminApiClient.get(`/disputes/${disputeId}/messages`);
      setDisputeMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch dispute messages:', error);
    }
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof DisputeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDisputeAction = async (disputeId: string, action: 'assign' | 'investigate' | 'resolve' | 'close', data?: any) => {
    try {
      switch (action) {
        case 'assign':
          await adminApiClient.post(`/disputes/${disputeId}/assign`, data);
          break;
        case 'investigate':
          await adminApiClient.post(`/disputes/${disputeId}/investigate`);
          break;
        case 'resolve':
          await adminApiClient.post(`/disputes/${disputeId}/resolve`, { resolution: data });
          break;
        case 'close':
          await adminApiClient.post(`/disputes/${disputeId}/close`);
          break;
      }
      fetchDisputes();
    } catch (error) {
      console.error(`Failed to ${action} dispute:`, error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;

    try {
      await adminApiClient.post(`/disputes/${selectedDispute.id}/messages`, {
        message: newMessage,
        senderType: 'admin'
      });
      setNewMessage('');
      fetchDisputeMessages(selectedDispute.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolution.trim()) return;

    try {
      await handleDisputeAction(selectedDispute.id, 'resolve', resolution);
      setShowResolutionModal(false);
      setResolution('');
      setShowDisputeModal(false);
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    }
  };

  const openDisputeModal = async (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowDisputeModal(true);
    await fetchDisputeMessages(dispute.id);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      open: AlertTriangle,
      investigating: Clock,
      resolved: CheckCircle,
      closed: XCircle
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
          <p className="text-gray-600">Manage and resolve customer disputes and mediation requests</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Disputes</dt>
                  <dd className="text-lg font-medium text-gray-900">{disputeStats.totalDisputes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Open</dt>
                  <dd className="text-lg font-medium text-gray-900">{disputeStats.openDisputes}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Investigating</dt>
                  <dd className="text-lg font-medium text-gray-900">{disputeStats.investigatingDisputes}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                  <dd className="text-lg font-medium text-gray-900">{disputeStats.resolvedDisputes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Resolution</dt>
                  <dd className="text-lg font-medium text-gray-900">{disputeStats.avgResolutionTime}h</dd>
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
              placeholder="Search disputes by order number, reason, or description..."
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
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.raisedBy || ''}
                onChange={(e) => handleFilterChange('raisedBy', e.target.value || undefined)}
              >
                <option value="">Raised By</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

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

      {/* Disputes Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedDisputes.length === disputes.length && disputes.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDisputes(disputes.map(d => d.id));
                      } else {
                        setSelectedDisputes([]);
                      }
                    }}
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  Dispute ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Raised By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
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
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    No disputes found
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedDisputes.includes(dispute.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDisputes([...selectedDisputes, dispute.id]);
                          } else {
                            setSelectedDisputes(selectedDisputes.filter(id => id !== dispute.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{dispute.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{dispute.orderId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{dispute.raisedBy}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{dispute.reason}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{dispute.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge('medium')} {/* Default priority, should come from API */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(dispute.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dispute.assignedTo ? dispute.assignedTo : 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openDisputeModal(dispute)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDisputeModal(dispute)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {dispute.status === 'open' && (
                          <button
                            onClick={() => handleDisputeAction(dispute.id, 'investigate')}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
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

      {/* Dispute Detail Modal */}
      {showDisputeModal && selectedDispute && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Dispute Details - {selectedDispute.id.slice(0, 8)}...
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dispute Information */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Dispute Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Order ID:</span> {selectedDispute.orderId}</div>
                    <div><span className="font-medium">Raised By:</span> {selectedDispute.raisedBy}</div>
                    <div><span className="font-medium">Reason:</span> {selectedDispute.reason}</div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedDispute.status)}</div>
                    <div><span className="font-medium">Created:</span> {new Date(selectedDispute.createdAt).toLocaleString()}</div>
                    {selectedDispute.resolvedAt && (
                      <div><span className="font-medium">Resolved:</span> {new Date(selectedDispute.resolvedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{selectedDispute.description}</p>
                </div>

                {selectedDispute.resolution && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Resolution</h4>
                    <p className="text-sm text-gray-700">{selectedDispute.resolution}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {selectedDispute.status === 'open' && (
                    <button
                      onClick={() => handleDisputeAction(selectedDispute.id, 'investigate')}
                      className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                    >
                      Start Investigation
                    </button>
                  )}
                  {selectedDispute.status === 'investigating' && (
                    <button
                      onClick={() => setShowResolutionModal(true)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Resolve Dispute
                    </button>
                  )}
                  {selectedDispute.status === 'resolved' && (
                    <button
                      onClick={() => handleDisputeAction(selectedDispute.id, 'close')}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Close Dispute
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Communication</h4>
                
                {/* Messages List */}
                <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
                  {disputeMessages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">No messages yet</p>
                  ) : (
                    <div className="space-y-3">
                      {disputeMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'admin' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-white text-gray-900'
                          }`}>
                            <div className="text-xs opacity-75 mb-1">
                              {message.senderType === 'admin' ? 'Admin' : message.senderType}
                            </div>
                            <div className="text-sm">{message.message}</div>
                            <div className="text-xs opacity-75 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Resolve Dispute</h3>
                <button
                  onClick={() => setShowResolutionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Please provide the resolution details:
                </p>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter resolution details..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResolutionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveDispute}
                  disabled={!resolution.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}