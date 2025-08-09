'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  isVerified: boolean;
}

interface Wallet {
  id: string;
  balance: number;
  lockedBalance: number;
  totalEarnings: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface WalletStats {
  totalWallets: number;
  totalBalance: number;
  totalLockedBalance: number;
  averageBalance: number;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<WalletStats>({
    totalWallets: 0,
    totalBalance: 0,
    totalLockedBalance: 0,
    averageBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWallets = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Transform user data to include wallet info (mock for now since we don't have wallet endpoint)
        const usersWithWallets = result.data.data.map((user: any) => ({
          id: `wallet_${user.id}`,
          balance: Math.random() * 10000,
          lockedBalance: Math.random() * 1000,
          totalEarnings: Math.random() * 50000,
          totalSpent: Math.random() * 30000,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          user: user,
        }));
        
        setWallets(usersWithWallets);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        
        // Calculate stats
        const totalBalance = usersWithWallets.reduce((sum: number, wallet: Wallet) => sum + wallet.balance, 0);
        const totalLockedBalance = usersWithWallets.reduce((sum: number, wallet: Wallet) => sum + wallet.lockedBalance, 0);
        
        setStats({
          totalWallets: usersWithWallets.length,
          totalBalance,
          totalLockedBalance,
          averageBalance: totalBalance / usersWithWallets.length || 0,
        });
      } else {
        toast.error('Failed to fetch wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Error fetching wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
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

  const filteredWallets = wallets.filter(wallet =>
    wallet.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold tracking-tight">Wallet Management</h1>
        <p className="text-gray-600">
          Monitor and manage user wallets and balances.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Wallets</p>
                <p className="text-2xl font-bold">{stats.totalWallets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold">{formatAmount(stats.totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Locked Balance</p>
                <p className="text-2xl font-bold">{formatAmount(stats.totalLockedBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Balance</p>
                <p className="text-2xl font-bold">{formatAmount(stats.averageBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search wallets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Wallets ({filteredWallets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>Locked Balance</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {wallet.user.firstName} {wallet.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {wallet.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={wallet.user.userType === 'seller' ? 'default' : 'secondary'}>
                        {wallet.user.userType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatAmount(wallet.balance)}
                    </TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {formatAmount(wallet.lockedBalance)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(wallet.totalEarnings)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(wallet.totalSpent)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={wallet.user.isVerified ? 'default' : 'secondary'}>
                        {wallet.user.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(wallet.updatedAt)}
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
                onClick={() => fetchWallets(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchWallets(currentPage + 1)}
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