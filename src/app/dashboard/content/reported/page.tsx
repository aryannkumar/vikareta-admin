'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';

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

interface ReportedContent {
  id: string;
  type: 'product' | 'review' | 'message';
  title: string;
  description: string;
  reportReason: string;
  status: 'pending_review' | 'approved' | 'removed' | 'dismissed';
  reportedAt: string;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
  reportCount: number;
}

interface ContentStats {
  totalReports: number;
  pendingReviews: number;
  removedContent: number;
  dismissedReports: number;
}

export default function ReportedContentPage() {
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [stats, setStats] = useState<ContentStats>({
    totalReports: 0,
    pendingReviews: 0,
    removedContent: 0,
    dismissedReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [, setSelectedContent] = useState<ReportedContent | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchReportedContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard/content/reported', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Transform the data to include report counts and additional fields
        const transformedContent = result.data.map((item: any) => ({
          ...item,
          reportCount: Math.floor(Math.random() * 10) + 1, // Mock report count
        }));
        
        setReportedContent(transformedContent);
        
        // Calculate stats
        const pendingReviews = transformedContent.filter((c: ReportedContent) => c.status === 'pending_review').length;
        const removedContent = transformedContent.filter((c: ReportedContent) => c.status === 'removed').length;
        const dismissedReports = transformedContent.filter((c: ReportedContent) => c.status === 'dismissed').length;
        
        setStats({
          totalReports: transformedContent.length,
          pendingReviews,
          removedContent,
          dismissedReports,
        });
      } else {
        toast.error('Failed to fetch reported content');
      }
    } catch (error) {
      console.error('Error fetching reported content:', error);
      toast.error('Error fetching reported content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedContent();
  }, []);

  const handleContentAction = async (contentId: string, action: 'approve' | 'remove' | 'dismiss') => {
    try {
      // Mock API call - in real implementation, this would call the backend
      const statusMap = {
        approve: 'approved',
        remove: 'removed',
        dismiss: 'dismissed'
      };
      
      const updatedContent = reportedContent.map(content => 
        content.id === contentId 
          ? { ...content, status: statusMap[action] as any }
          : content
      );
      
      setReportedContent(updatedContent);
      setSelectedContent(null);
      setAdminNotes('');
      toast.success(`Content ${action}d successfully`);
      
      // Recalculate stats
      const pendingReviews = updatedContent.filter(c => c.status === 'pending_review').length;
      const removedContent = updatedContent.filter(c => c.status === 'removed').length;
      const dismissedReports = updatedContent.filter(c => c.status === 'dismissed').length;
      
      setStats({
        totalReports: updatedContent.length,
        pendingReviews,
        removedContent,
        dismissedReports,
      });
    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Error processing content');
    }
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
      pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      removed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      dismissed: { color: 'bg-gray-100 text-gray-800', icon: Eye },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_review;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      product: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      message: 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const filteredContent = reportedContent.filter(content => {
    const matchesSearch = 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.seller.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.seller.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.reportReason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    const matchesType = typeFilter === 'all' || content.type === typeFilter;
    
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
        <h1 className="text-3xl font-bold tracking-tight">Reported Content</h1>
        <p className="text-gray-600">
          Review and manage content reported by users.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold">{stats.pendingReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Removed Content</p>
                <p className="text-2xl font-bold">{stats.removedContent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dismissed Reports</p>
                <p className="text-2xl font-bold">{stats.dismissedReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reported content..."
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
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="removed">Removed</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="product">Product</option>
          <option value="review">Review</option>
          <option value="message">Message</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reported Content ({filteredContent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Report Reason</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{content.title}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {content.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(content.type)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {content.seller.firstName} {content.seller.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {content.seller.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={content.reportReason}>
                        {content.reportReason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{content.reportCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(content.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(content.reportedAt)}
                    </TableCell>
                    <TableCell>
                      {content.status === 'pending_review' && (
                        <Dialog>
                          <DialogTrigger>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedContent(content)}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Reported Content</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p><strong>Title:</strong> {content.title}</p>
                                <p><strong>Type:</strong> {content.type}</p>
                                <p><strong>Seller:</strong> {content.seller.firstName} {content.seller.lastName}</p>
                                <p><strong>Report Reason:</strong> {content.reportReason}</p>
                                <p><strong>Number of Reports:</strong> {content.reportCount}</p>
                                {content.category && (
                                  <p><strong>Category:</strong> {content.category.name}</p>
                                )}
                              </div>
                              <div>
                                <p><strong>Description:</strong></p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                  {content.description}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Admin Notes
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about this content review decision..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleContentAction(content.id, 'approve')}
                                  className="flex-1"
                                >
                                  Approve Content
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleContentAction(content.id, 'remove')}
                                  className="flex-1"
                                >
                                  Remove Content
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleContentAction(content.id, 'dismiss')}
                                  className="flex-1"
                                >
                                  Dismiss Report
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
        </CardContent>
      </Card>
    </div>
  );
}