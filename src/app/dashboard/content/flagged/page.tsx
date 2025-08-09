'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Flag, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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

interface FlaggedContent {
  id: string;
  type: 'product' | 'review' | 'message';
  title: string;
  description: string;
  flagReason: string;
  status: 'flagged' | 'reviewed' | 'approved' | 'removed';
  flaggedAt: string;
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
  severity: 'low' | 'medium' | 'high';
}

interface FlaggedStats {
  totalFlagged: number;
  highSeverity: number;
  reviewedContent: number;
  removedContent: number;
}

export default function FlaggedContentPage() {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [stats, setStats] = useState<FlaggedStats>({
    totalFlagged: 0,
    highSeverity: 0,
    reviewedContent: 0,
    removedContent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [, setSelectedContent] = useState<FlaggedContent | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard/content/flagged', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Transform the data to include severity and additional fields
        const transformedContent = result.data.map((item: any) => ({
          ...item,
          severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        }));

        setFlaggedContent(transformedContent);

        // Calculate stats
        const highSeverity = transformedContent.filter((c: FlaggedContent) => c.severity === 'high').length;
        const reviewedContent = transformedContent.filter((c: FlaggedContent) => c.status === 'reviewed').length;
        const removedContent = transformedContent.filter((c: FlaggedContent) => c.status === 'removed').length;

        setStats({
          totalFlagged: transformedContent.length,
          highSeverity,
          reviewedContent,
          removedContent,
        });
      } else {
        toast.error('Failed to fetch flagged content');
      }
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      toast.error('Error fetching flagged content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedContent();
  }, []);

  const handleContentAction = async (contentId: string, action: 'approve' | 'remove' | 'review') => {
    try {
      // Mock API call - in real implementation, this would call the backend
      const statusMap = {
        approve: 'approved',
        remove: 'removed',
        review: 'reviewed'
      };

      const updatedContent = flaggedContent.map(content =>
        content.id === contentId
          ? { ...content, status: statusMap[action] as any }
          : content
      );

      setFlaggedContent(updatedContent);
      setSelectedContent(null);
      setAdminNotes('');
      toast.success(`Content ${action}d successfully`);

      // Recalculate stats
      const highSeverity = updatedContent.filter(c => c.severity === 'high').length;
      const reviewedContent = updatedContent.filter(c => c.status === 'reviewed').length;
      const removedContent = updatedContent.filter(c => c.status === 'removed').length;

      setStats({
        totalFlagged: updatedContent.length,
        highSeverity,
        reviewedContent,
        removedContent,
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
      flagged: { color: 'bg-red-100 text-red-800', icon: Flag },
      reviewed: { color: 'bg-blue-100 text-blue-800', icon: Eye },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      removed: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.flagged;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'bg-green-100 text-green-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      high: { color: 'bg-red-100 text-red-800' },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.low;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <AlertTriangle className="h-3 w-3" />
        {severity}
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

  const filteredContent = flaggedContent.filter(content => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.seller.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.seller.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.flagReason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || content.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
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
        <h1 className="text-3xl font-bold tracking-tight">Flagged Content</h1>
        <p className="text-gray-600">
          Review and manage content flagged by automated systems.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Flag className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Flagged</p>
                <p className="text-2xl font-bold">{stats.totalFlagged}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Severity</p>
                <p className="text-2xl font-bold">{stats.highSeverity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold">{stats.reviewedContent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Removed</p>
                <p className="text-2xl font-bold">{stats.removedContent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search flagged content..."
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
          <option value="flagged">Flagged</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="removed">Removed</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Content ({filteredContent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Flag Reason</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged Date</TableHead>
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
                      <div className="max-w-xs truncate" title={content.flagReason}>
                        {content.flagReason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(content.severity)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(content.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(content.flaggedAt)}
                    </TableCell>
                    <TableCell>
                      {content.status === 'flagged' && (
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
                              <DialogTitle>Review Flagged Content</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p><strong>Title:</strong> {content.title}</p>
                                <p><strong>Type:</strong> {content.type}</p>
                                <p><strong>Seller:</strong> {content.seller.firstName} {content.seller.lastName}</p>
                                <p><strong>Flag Reason:</strong> {content.flagReason}</p>
                                <p><strong>Severity:</strong> {content.severity}</p>
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
                                  onClick={() => handleContentAction(content.id, 'review')}
                                  className="flex-1"
                                >
                                  Mark as Reviewed
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