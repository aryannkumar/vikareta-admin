'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  AlertTriangle,
  Download,
  Tag
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { Product, Category, FilterOptions, PaginatedResponse } from '@/types';

interface PendingProductFilters extends FilterOptions {
  categoryId?: string;
  isService?: boolean;
  priceMin?: number;
  priceMax?: number;
}

export default function PendingProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState<PendingProductFilters>({
    page: 1,
    limit: 20,
    search: '',
    status: 'pending', // Only show pending products
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingProducts();
    fetchCategories();
  }, [filters]);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getProducts(filters);
      const data: PaginatedResponse<Product> = response.data.data;
      setProducts(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch pending products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminApiClient.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof PendingProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleProductAction = async (productId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (action === 'approve') {
        await adminApiClient.approveProduct(productId);
      } else if (action === 'reject') {
        await adminApiClient.rejectProduct(productId, reason || 'No reason provided');
      }
      fetchPendingProducts();
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'export') => {
    if (action === 'export') {
      const exportData = products.filter(product => selectedProducts.includes(product.id));
      const csv = convertToCSV(exportData);
      downloadCSV(csv, 'pending-products.csv');
      return;
    }

    try {
      await Promise.all(
        selectedProducts.map(productId => handleProductAction(productId, action))
      );
      setSelectedProducts([]);
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
    }
  };

  const convertToCSV = (data: Product[]) => {
    const headers = ['ID', 'Title', 'Seller', 'Category', 'Price', 'Stock', 'Submitted At'];
    const rows = data.map(product => [
      product.id,
      product.title,
      product.seller ? `${product.seller.firstName} ${product.seller.lastName}` : '',
      product.category?.name || '',
      `₹${product.price}`,
      product.stockQuantity,
      new Date(product.createdAt).toLocaleDateString()
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

  const getPendingBadge = () => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending Review
      </span>
    );
  };

  const getPriorityBadge = (product: Product) => {
    const isHighValue = product.price > 50000;
    const isBusinessSeller = product.seller?.businessName;
    const priority = isHighValue || isBusinessSeller ? 'high' : 'normal';
    
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          HIGH
        </span>
      );
    }
    return null;
  };

  const handleRejectProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (selectedProduct && rejectReason.trim()) {
      await handleProductAction(selectedProduct.id, 'reject', rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedProduct(null);
    }
  };

  const getDaysWaiting = (createdAt: string) => {
    const submittedDate = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submittedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Product Approvals</h1>
          <p className="text-gray-600">Review and approve product listings awaiting moderation</p>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
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
                    {products.filter(p => p.price > 50000 || p.seller?.businessName).length}
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
                <Package className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Products</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => !p.isService).length}
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
                <Tag className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Services</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => p.isService).length}
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
              placeholder="Search products by title, description, or seller..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.isService !== undefined ? filters.isService.toString() : ''}
                onChange={(e) => handleFilterChange('isService', e.target.value ? e.target.value === 'true' : undefined)}
              >
                <option value="">Products & Services</option>
                <option value="false">Products Only</option>
                <option value="true">Services Only</option>
              </select>

              <input
                type="number"
                placeholder="Min Price"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.priceMin || ''}
                onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
              />

              <input
                type="number"
                placeholder="Max Price"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.priceMax || ''}
                onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
              />

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.sortBy || ''}
                onChange={(e) => handleFilterChange('sortBy', e.target.value || 'createdAt')}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-700">
              {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
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

      {/* Pending Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(products.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  Waiting
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <p>No pending products</p>
                      <p className="text-sm">All product submissions have been reviewed</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.media && product.media.length > 0 ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.media[0].url}
                              alt={product.media[0].altText || product.title}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                              {product.isService ? (
                                <Tag className="h-6 w-6 text-yellow-600" />
                              ) : (
                                <Package className="h-6 w-6 text-yellow-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.isService ? 'Service' : 'Product'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.seller ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.seller.firstName} {product.seller.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{product.seller.email}</div>
                          {product.seller.businessName && (
                            <div className="text-xs text-gray-400">{product.seller.businessName}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPendingBadge()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getDaysWaiting(product.createdAt) > 3 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {getDaysWaiting(product.createdAt)} days
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
                          onClick={() => handleProductAction(product.id, 'approve')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectProduct(product)}
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Product</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Please provide a reason for rejecting this product:
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
                  Reject Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}