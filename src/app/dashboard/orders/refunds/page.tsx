'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

// Simple component replacements
const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="min-w-full divide-y divide-gray-200">{children}</table>
);
const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);
const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);
const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr>{children}</tr>
);
const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>
);
const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm ${className || 'text-gray-900'}`}>{children}</td>
);

const Textarea = ({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string; 
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    rows={3}
  />
);

// Simple toast replacement
const toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`)
};

interface RefundRequest {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestDate: string;
  processedDate?: string;
  adminNotes?: string;
  refundMethod: string;
}

interface RefundStats {
  totalRequests: number;
  pendingRequests: number;
  approvedAmount: number;
  rejectedRequests: number;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [stats, setStats] = useState<RefundStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedAmount: 0,
    rejectedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRefunds = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard/orders/refunds?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Transform orders to refund requests
        const mockRefunds = result.data.map((order: any) => ({
          id: `refund_${order.id}`,
          orderId: order.id,
          buyerId: order.buyer.id,
          buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
          buyerEmail: order.buyer.email,
          sellerId: order.seller.id,
          sellerName: `${order.seller.firstName} ${order.seller.lastName}`,
          amount: order.totalAmount,
          reason: order.status === 'cancelled' ? 'Order cancelled by buyer' : 
                  order.status === 'returned' ? 'Product returned' : 'Refund requested',
          status: Math.random() > 0.6 ? 'pending' : Math.random() > 0.3 ? 'approved' : 'rejected',
          requestDate: order.updatedAt,
          refundMethod: 'Original Payment Method',
        }));
        
        setRefunds(mockRefunds);
        setTotalPages(Math.ceil(mockRefunds.length / 20));
        
        // Calculate stats
        const pendingRequests = mockRefunds.filter((r: RefundRequest) => r.status === 'pending').length;
        const approvedAmount = mockRefunds
          .filter((r: RefundRequest) => r.status === 'approved')
          .reduce((sum: number, r: RefundRequest) => sum + r.amount, 0);
        const rejectedRequests = mockRefunds.filter((r: RefundRequest) => r.status === 'rejected').length;
        
        setStats({
          totalRequests: mockRefunds.length,
          pendingRequests,
          approvedAmount,
          rejectedRequests,
        });
      } else {
        toast.error('Failed to fetch refund requests');
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Error fetching refund requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleRefundAction = async (refundId: string, action: 'approve' | 'reject') => {
    try {
      // Mock API call - in real implementation, this would call the backend
      const updatedRefunds = refunds.map(refund => 
        refund.id === refundId 
          ? { 
              ...refund, 
              status: (action === 'approve' ? 'approved' : 'rejected') as 'pending' | 'approved' | 'rejected' | 'processed',
              processedDate: new Date().toISOString(),
              adminNotes: adminNotes
            }
          : refund
      );
      
      setRefunds(updatedRefunds);
      setSelectedRefund(null);
      setAdminNotes('');
      toast.success(`Refund ${action}d successfully`);
      
      // Recalculate stats
      const pendingRequests = updatedRefunds.filter(r => r.status === 'pending').length;
      const approvedAmount = updatedRefunds
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.amount, 0);
      const rejectedRequests = updatedRefunds.filter(r => r.status === 'rejected').length;
      
      setStats({
        totalRequests: updatedRefunds.length,
        pendingRequests,
        approvedAmount,
        rejectedRequests,
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Error processing refund');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      processed: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Refunds</h1>
        <p className="text-gray-600">
          Manage order refunds and return requests.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Amount</p>
                <p className="text-2xl font-bold">{formatAmount(stats.approvedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected Requests</p>
                <p className="text-2xl font-bold">{stats.rejectedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search refund requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processed">Processed</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refund Requests ({filteredRefunds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell className="font-mono text-sm">
                      {refund.id.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {refund.orderId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{refund.buyerName}</div>
                        <div className="text-sm text-gray-500">{refund.buyerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(refund.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={refund.reason}>
                        {refund.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(refund.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(refund.requestDate)}
                    </TableCell>
                    <TableCell>
                      {refund.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRefund(refund)}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Refund Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p><strong>Order ID:</strong> {refund.orderId}</p>
                                <p><strong>Buyer:</strong> {refund.buyerName}</p>
                                <p><strong>Amount:</strong> {formatAmount(refund.amount)}</p>
                                <p><strong>Reason:</strong> {refund.reason}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Admin Notes
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about this refund decision..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleRefundAction(refund.id, 'approve')}
                                  className="flex-1"
                                >
                                  Approve Refund
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleRefundAction(refund.id, 'reject')}
                                  className="flex-1"
                                >
                                  Reject Refund
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}