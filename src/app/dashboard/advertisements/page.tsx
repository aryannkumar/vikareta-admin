'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignApprovalList } from '@/components/advertisements/campaign-approval-list';
import { CampaignApprovalStats } from '@/components/advertisements/campaign-approval-stats';
import { AdPlatformAnalytics } from '@/components/advertisements/ad-platform-analytics';
import { AdRevenueAnalytics } from '@/components/advertisements/ad-revenue-analytics';
import { AdSystemHealth } from '@/components/advertisements/ad-system-health';
import { useAdminAdvertisements } from '@/lib/hooks/use-admin-advertisements';
import { Search, TrendingUp, Shield, AlertTriangle } from 'lucide-react';

export default function AdvertisementsPage() {
  const [activeTab, setActiveTab] = useState('approvals');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('all');

  const {
    approvalStats,
    platformAnalytics,
    revenueAnalytics,
    systemHealth,
    isLoading,
    error,
    refreshData
  } = useAdminAdvertisements();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refreshData} className="bg-orange-500 hover:bg-orange-600">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advertisement Management</h1>
          <p className="text-gray-600 mt-1">
            Manage campaign approvals, monitor platform performance, and track revenue
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {approvalStats?.totalPending || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {platformAnalytics?.activeCampaigns || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{revenueAnalytics?.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemHealth?.adServingPerformance?.successRate
                    ? `${(systemHealth.adServingPerformance.successRate * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            onClick={() => setActiveTab('approvals')}
            data-state={activeTab === 'approvals' ? 'active' : 'inactive'}
          >
            Campaign Approvals
          </TabsTrigger>
          <TabsTrigger
            onClick={() => setActiveTab('analytics')}
            data-state={activeTab === 'analytics' ? 'active' : 'inactive'}
          >
            Platform Analytics
          </TabsTrigger>
          <TabsTrigger
            onClick={() => setActiveTab('revenue')}
            data-state={activeTab === 'revenue' ? 'active' : 'inactive'}
          >
            Revenue Tracking
          </TabsTrigger>
          <TabsTrigger
            onClick={() => setActiveTab('health')}
            data-state={activeTab === 'health' ? 'active' : 'inactive'}
          >
            System Health
          </TabsTrigger>
        </TabsList>

        {activeTab === 'approvals' && (
          <TabsContent className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Approval Management</CardTitle>
                <CardDescription>
                  Review and approve advertisement campaigns submitted by businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-[180px]"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                  <Select
                    value={campaignTypeFilter}
                    onChange={(e) => setCampaignTypeFilter(e.target.value)}
                    className="w-full sm:w-[180px]"
                  >
                    <option value="all">All Types</option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="brand">Brand</option>
                  </Select>
                </div>

                {/* Approval Stats */}
                <CampaignApprovalStats stats={approvalStats} />
              </CardContent>
            </Card>

            {/* Campaign List */}
            <CampaignApprovalList
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              campaignTypeFilter={campaignTypeFilter}
              onRefresh={refreshData}
            />
          </TabsContent>
        )}

        {activeTab === 'analytics' && (
          <TabsContent className="space-y-6">
            <AdPlatformAnalytics analytics={platformAnalytics} />
          </TabsContent>
        )}

        {activeTab === 'revenue' && (
          <TabsContent className="space-y-6">
            <AdRevenueAnalytics analytics={revenueAnalytics} />
          </TabsContent>
        )}

        {activeTab === 'health' && (
          <TabsContent className="space-y-6">
            <AdSystemHealth health={systemHealth} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}