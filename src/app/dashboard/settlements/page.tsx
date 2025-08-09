'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

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

// Simple toast replacement
const toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`)
};

interface Settlement {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settlementDate: string;
  orderId: string;
  paymentMethod: string;
  transactionFee: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface SettlementStats {
  totalSettlements: number;
  pendingAmount: number;
  completedAmount: number;
  failedAmount: number;
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<SettlementStats>({
    totalSettlements: 0,
    pendingAmount: 0,
    completedAmount: 0,
    failedAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSettlements = async (page = 1) => {
    try {
      setLoading(true);
      // Since we don't have a settlements endpoint, we'll use orders data to simulate settlements
      const response = await fetch(`/api/admin/orders?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Transform orders to settlements
        const mockSettlements = result.data.data
          .filter((order: any) => order.status === 'delivered')
          .map((order: any) => ({
            id: `settlement_${order.id}`,
            sellerId: order.seller.id,
            sellerName: `${order.seller.firstName} ${order.seller.lastName}`,
            sellerEmail: order.seller.email,
            amount: order.totalAmount,
            status: Math.random() > 0.7 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'processing',
            settlementDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            orderId: order.id,
            paymentMethod: 'Bank Transfer',
            transactionFee: order.totalAmount * 0.02, // 2% fee
            netAmount: order.totalAmount * 0.98,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          }));
        
        setSettlements(mockSettlements);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        
        // Calculate stats
        const pendingAmount = mockSettlements
          .filter((s: Settlement) => s.status === 'pending')
          .reduce((sum: number, s: Settlement) => sum + s.netAmount, 0);
        
        const completedAmount = mockSettlements
          .filter((s: Settlement) => s.status === 'completed')
          .reduce((sum: number, s: Settlement) => sum + s.netAmount, 0);
        
        const failedAmount = mockSettlements
          .filter((s: Settlement) => s.status === 'failed')
          .reduce((sum: number, s: Settlement) => sum + s.netAmount, 0);
        
        setStats({
          totalSettlements: mockSettlements.length,
          pendingAmount,
          completedAmount,
          failedAmount,
        });
      } else {
        toast.error('Failed to fetch settlements');
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('Error fetching settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

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
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
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

  const filteredSettlements = settlements.filter(settlement => {
    const matchesSearch = 
      settlement.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.sellerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;
    
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
        <h1 className="text-3xl font-bold tracking-tight">Settlements</h1>
        <p className="text-gray-600">
          Manage payment settlements and seller payouts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Settlements</p>
                <p className="text-2xl font-bold">{stats.totalSettlements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold">{formatAmount(stats.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Amount</p>
                <p className="text-2xl font-bold">{formatAmount(stats.completedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Amount</p>
                <p className="text-2xl font-bold">{formatAmount(stats.failedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search settlements..."
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
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settlements ({filteredSettlements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement ID</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Settlement Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-mono text-sm">
                      {settlement.id.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{settlement.sellerName}</div>
                        <div className="text-sm text-gray-500">{settlement.sellerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {settlement.orderId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(settlement.amount)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      -{formatAmount(settlement.transactionFee)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatAmount(settlement.netAmount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(settlement.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(settlement.settlementDate)}
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
                onClick={() => fetchSettlements(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSettlements(currentPage + 1)}
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