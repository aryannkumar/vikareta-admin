'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

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

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  status: string;
  referenceType: string;
  referenceId: string;
  cashfreeTransactionId?: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/transactions?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setTransactions(result.data.data || []);
        setPagination(result.data.pagination);
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      credit: 'bg-green-100 text-green-800',
      debit: 'bg-red-100 text-red-800',
      refund: 'bg-blue-100 text-blue-800',
      withdrawal: 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.cashfreeTransactionId && transaction.cashfreeTransactionId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.transactionType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
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
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-gray-600">
          Monitor all platform transactions and payments.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search transactions..."
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
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
          <option value="refund">Refund</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {transaction.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transaction.user.firstName} {transaction.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(transaction.transactionType)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{transaction.referenceType}</div>
                        {transaction.cashfreeTransactionId && (
                          <div className="text-gray-500 font-mono">
                            {transaction.cashfreeTransactionId.slice(0, 12)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} transactions
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTransactions(pagination.page - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTransactions(pagination.page + 1)}
                disabled={!pagination.hasNext}
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