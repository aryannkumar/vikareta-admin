'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminCampaigns } from '@/lib/hooks/use-admin-campaigns';
import { AdCampaign, AdApproval } from '@/types';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  DollarSign, 
  Target,
  ExternalLink,
  AlertTriangle,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CampaignApprovalListProps {
  searchQuery: string;
  statusFilter: string;
  campaignTypeFilter: string;
  onRefresh: () => void;
}

export function CampaignApprovalList({
  searchQuery,
  statusFilter,
  campaignTypeFilter,
  onRefresh
}: CampaignApprovalListProps) {
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [viewingCampaign, setViewingCampaign] = useState<AdCampaign | null>(null);
  const [approvingCampaign, setApprovingCampaign] = useState<AdCampaign | null>(null);
  const [rejectingCampaign, setRejectingCampaign] = useState<AdCampaign | null>(null);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    campaigns,
    isLoading,
    error,
    approveCampaign,
    rejectCampaign,
    bulkApproveCampaigns,
    bulkRejectCampaigns,
    getQualityScore,
    refreshCampaigns
  } = useAdminCampaigns({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
    campaignType: campaignTypeFilter === 'all' ? undefined : campaignTypeFilter
  });

  useEffect(() => {
    refreshCampaigns();
  }, [searchQuery, statusFilter, campaignTypeFilter, refreshCampaigns]);

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(campaigns.map(c => c.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSingleApprove = async () => {
    if (!approvingCampaign) return;

    try {
      await approveCampaign(approvingCampaign.id, reviewNotes);
      setApprovingCampaign(null);
      setReviewNotes('');
      onRefresh();
    } catch (error) {
      console.error('Failed to approve campaign:', error);
    }
  };

  const handleSingleReject = async () => {
    if (!rejectingCampaign) return;

    try {
      await rejectCampaign(rejectingCampaign.id, rejectionReason, reviewNotes);
      setRejectingCampaign(null);
      setRejectionReason('');
      setReviewNotes('');
      onRefresh();
    } catch (error) {
      console.error('Failed to reject campaign:', error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCampaigns.length === 0) return;

    try {
      if (bulkAction === 'approve') {
        await bulkApproveCampaigns(selectedCampaigns, reviewNotes);
      } else {
        await bulkRejectCampaigns(selectedCampaigns, rejectionReason, reviewNotes);
      }
      
      setSelectedCampaigns([]);
      setBulkAction(null);
      setReviewNotes('');
      setRejectionReason('');
      onRefresh();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      paused: { color: 'bg-gray-100 text-gray-800', label: 'Paused' },
      completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_approval;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCampaignTypeBadge = (type: string) => {
    const typeConfig = {
      product: { color: 'bg-orange-100 text-orange-800', label: 'Product' },
      service: { color: 'bg-blue-100 text-blue-800', label: 'Service' },
      brand: { color: 'bg-purple-100 text-purple-800', label: 'Brand' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.product;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Campaigns</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshCampaigns} className="bg-orange-500 hover:bg-orange-600">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Reviews</CardTitle>
              <CardDescription>
                {campaigns.length} campaigns found
              </CardDescription>
            </div>
            {selectedCampaigns.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Bulk Approve ({selectedCampaigns.length})
                </Button>
                <Button
                  onClick={() => setBulkAction('reject')}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Bulk Reject ({selectedCampaigns.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
              <p className="text-gray-600">
                No campaigns match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 pb-4 border-b">
                <Checkbox
                  checked={selectedCampaigns.length === campaigns.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <label className="text-sm font-medium">
                  Select All ({campaigns.length})
                </label>
              </div>

              {/* Campaign List */}
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={(e) => 
                        handleSelectCampaign(campaign.id, e.target.checked)
                      }
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {campaign.name}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {campaign.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(campaign.status)}
                          {getCampaignTypeBadge(campaign.campaignType)}
                        </div>
                      </div>

                      {/* Campaign Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          {campaign.business?.businessName || 'Unknown Business'}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Budget: ₹{campaign.budget.toLocaleString()}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Target className="h-4 w-4 mr-2" />
                          {campaign.biddingStrategy.toUpperCase()}: ₹{campaign.bidAmount}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => setViewingCampaign(campaign)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {campaign.ads && campaign.ads.length > 0 && (
                            <Button
                              onClick={() => window.open(campaign.ads?.[0]?.destinationUrl, '_blank')}
                              variant="outline"
                              size="sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          )}
                        </div>

                        {campaign.status === 'pending_approval' && (
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => setApprovingCampaign(campaign)}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => setRejectingCampaign(campaign)}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details Modal */}
      <Dialog open={!!viewingCampaign} onOpenChange={() => setViewingCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              Review campaign information and advertisements
            </DialogDescription>
          </DialogHeader>
          
          {viewingCampaign && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Campaign Name</label>
                      <p className="text-gray-900">{viewingCampaign.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Business</label>
                      <p className="text-gray-900">{viewingCampaign.business?.businessName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <p className="text-gray-900">{viewingCampaign.campaignType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(viewingCampaign.status)}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Budget Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Budget & Bidding</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Budget</label>
                      <p className="text-gray-900">₹{viewingCampaign.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Daily Budget</label>
                      <p className="text-gray-900">
                        {viewingCampaign.dailyBudget 
                          ? `₹${viewingCampaign.dailyBudget.toLocaleString()}`
                          : 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bidding Strategy</label>
                      <p className="text-gray-900">{viewingCampaign.biddingStrategy.toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bid Amount</label>
                      <p className="text-gray-900">₹{viewingCampaign.bidAmount}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Targeting */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Targeting Configuration</h3>
                  <div className="space-y-3">
                    {viewingCampaign.targetingConfig.demographics && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Demographics</label>
                        <div className="text-gray-900">
                          {viewingCampaign.targetingConfig.demographics.ageRange && (
                            <p>Age: {viewingCampaign.targetingConfig.demographics.ageRange.join('-')}</p>
                          )}
                          {viewingCampaign.targetingConfig.demographics.gender && (
                            <p>Gender: {viewingCampaign.targetingConfig.demographics.gender}</p>
                          )}
                          {viewingCampaign.targetingConfig.demographics.interests && (
                            <p>Interests: {viewingCampaign.targetingConfig.demographics.interests.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {viewingCampaign.targetingConfig.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <div className="text-gray-900">
                          {viewingCampaign.targetingConfig.location.countries && (
                            <p>Countries: {viewingCampaign.targetingConfig.location.countries.join(', ')}</p>
                          )}
                          {viewingCampaign.targetingConfig.location.states && (
                            <p>States: {viewingCampaign.targetingConfig.location.states.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Advertisements */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Advertisements</h3>
                  {viewingCampaign.ads && viewingCampaign.ads.length > 0 ? (
                    <div className="space-y-4">
                      {viewingCampaign.ads.map((ad) => (
                        <div key={ad.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold">{ad.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{ad.adType}</Badge>
                              <Badge variant="outline">{ad.adFormat}</Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{ad.description}</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Call to Action: <span className="font-medium">{ad.callToAction}</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Priority: <span className="font-medium">{ad.priority}/10</span>
                              </p>
                            </div>
                            <Button
                              onClick={() => window.open(ad.destinationUrl, '_blank')}
                              variant="outline"
                              size="sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit Landing Page
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No advertisements found</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Approve Modal */}
      <Dialog open={!!approvingCampaign} onOpenChange={() => setApprovingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Campaign</DialogTitle>
            <DialogDescription>
              Approve "{approvingCampaign?.name}" for launch
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Review Notes (Optional)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingCampaign(null)}>
              Cancel
            </Button>
            <Button onClick={handleSingleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Reject Modal */}
      <Dialog open={!!rejectingCampaign} onOpenChange={() => setRejectingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
            <DialogDescription>
              Reject "{rejectingCampaign?.name}" and provide feedback
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this campaign is being rejected..."
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any additional feedback..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingCampaign(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSingleReject} 
              variant="destructive"
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Modal */}
      <Dialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'approve' ? 'Bulk Approve Campaigns' : 'Bulk Reject Campaigns'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'approve' 
                ? `Approve ${selectedCampaigns.length} selected campaigns`
                : `Reject ${selectedCampaigns.length} selected campaigns`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {bulkAction === 'reject' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why these campaigns are being rejected..."
                  className="mt-1"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">
                {bulkAction === 'approve' ? 'Review Notes (Optional)' : 'Additional Notes (Optional)'}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={bulkAction === 'approve' 
                  ? "Add any notes about these approvals..."
                  : "Add any additional feedback..."
                }
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAction}
              className={bulkAction === 'approve' 
                ? "bg-green-600 hover:bg-green-700" 
                : ""
              }
              variant={bulkAction === 'reject' ? "destructive" : "default"}
              disabled={bulkAction === 'reject' && !rejectionReason.trim()}
            >
              {bulkAction === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {bulkAction === 'approve' 
                ? `Approve ${selectedCampaigns.length} Campaigns`
                : `Reject ${selectedCampaigns.length} Campaigns`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}