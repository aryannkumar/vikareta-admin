'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AdPlatformAnalytics } from '@/types';
import { 
  TrendingUp, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Monitor, 
  Smartphone, 
  BarChart3,
  Users,
  Target,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AdPlatformAnalyticsProps {
  analytics: AdPlatformAnalytics | null;
}

export function AdPlatformAnalytics({ analytics }: AdPlatformAnalyticsProps) {
  if (!analytics) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const platformColors = {
    web: '#3b82f6',
    mobile: '#f97316',
    dashboard: '#8b5cf6'
  };

  const pieData = [
    { name: 'Web', value: analytics.platformBreakdown.web.impressions, color: platformColors.web },
    { name: 'Mobile', value: analytics.platformBreakdown.mobile.impressions, color: platformColors.mobile },
    { name: 'Dashboard', value: analytics.platformBreakdown.dashboard.impressions, color: platformColors.dashboard }
  ];

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalCampaigns)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {formatNumber(analytics.activeCampaigns)} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Impressions</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalImpressions)}</p>
                <p className="text-xs text-green-600 mt-1">
                  Platform-wide views
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MousePointer className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalClicks)}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {analytics.averageCTR.toFixed(2)}% CTR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalSpend)}</p>
                <p className="text-xs text-purple-600 mt-1">
                  ₹{analytics.averageCPC.toFixed(2)} avg CPC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Daily performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => {
                    if (name === 'spend' || name === 'revenue') {
                      return [formatCurrency(value), name];
                    }
                    return [formatNumber(value), name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Impressions"
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Clicks"
                />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Spend"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-blue-500" />
              Platform Distribution
            </CardTitle>
            <CardDescription>
              Impressions by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              Platform Performance
            </CardTitle>
            <CardDescription>
              Detailed metrics by platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Web Platform */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Monitor className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">Web Platform</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Impressions</p>
                  <p className="font-semibold">{formatNumber(analytics.platformBreakdown.web.impressions)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Clicks</p>
                  <p className="font-semibold">{formatNumber(analytics.platformBreakdown.web.clicks)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Spend</p>
                  <p className="font-semibold">{formatCurrency(analytics.platformBreakdown.web.spend)}</p>
                </div>
              </div>
            </div>

            {/* Mobile Platform */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="font-medium">Mobile Platform</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Growing</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Impressions</p>
                  <p className="font-semibold">{formatNumber(analytics.platformBreakdown.mobile.impressions)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Clicks</p>
                  <p className="font-semibold">{formatNumber(analytics.platformBreakdown.mobile.clicks)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Spend</p>
                  <p className="font-semibold">{formatCurrency(analytics.platformBreakdown.mobile.spend)}</p>
                </div>
              </div>
            </div>

            {/* Dashboard Platform */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium">Dashboard Platform</span>
                </div>
                <Badge className="bg-purple-100 text-purple-800">Business</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Impressions</p>
                  <p className="font-semibold">{formatNumber(analytics.platformBreakdown.dashboard.impressions)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Clicks</p>
                  <p className="font-semibold">{formatNumber(analytics.platformBreakdown.dashboard.clicks)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Spend</p>
                  <p className="font-semibold">{formatCurrency(analytics.platformBreakdown.dashboard.spend)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-500" />
            Top Performing Campaigns
          </CardTitle>
          <CardDescription>
            Campaigns with highest performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topPerformingCampaigns && analytics.topPerformingCampaigns.length > 0 ? (
            <div className="space-y-4">
              {analytics.topPerformingCampaigns.slice(0, 5).map((campaign, index) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">{campaign.business?.businessName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Budget</p>
                      <p className="font-semibold">{formatCurrency(campaign.budget)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Spent</p>
                      <p className="font-semibold">{formatCurrency(campaign.spentAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Type</p>
                      <Badge variant="outline">{campaign.campaignType}</Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Status</p>
                      <Badge className={
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Data</h3>
              <p className="text-gray-600">
                Campaign performance data will appear here once campaigns are active.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>
            Overall platform health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.averageCTR.toFixed(2)}%
              </div>
              <p className="text-sm text-gray-600">Average CTR</p>
              <div className="mt-2">
                <Progress value={analytics.averageCTR * 10} className="h-2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.averageCTR > 2 ? 'Excellent' : analytics.averageCTR > 1 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                ₹{analytics.averageCPC.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Average CPC</p>
              <div className="mt-2">
                <div className="text-xs text-gray-500">
                  Cost efficiency metric
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {((analytics.activeCampaigns / analytics.totalCampaigns) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Campaign Activity Rate</p>
              <div className="mt-2">
                <Progress value={(analytics.activeCampaigns / analytics.totalCampaigns) * 100} className="h-2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Active vs Total Campaigns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}