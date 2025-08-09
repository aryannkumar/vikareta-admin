'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AdRevenueAnalytics } from '@/types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Monitor, 
  Smartphone, 
  BarChart3,
  ExternalLink,
  Building,
  Calendar,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface AdRevenueAnalyticsProps {
  analytics: AdRevenueAnalytics | null;
}

export function AdRevenueAnalytics({ analytics }: AdRevenueAnalyticsProps) {
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

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  const platformRevenueData = [
    { name: 'Web', value: analytics.revenueByPlatform.web, color: '#3b82f6' },
    { name: 'Mobile', value: analytics.revenueByPlatform.mobile, color: '#f97316' },
    { name: 'Dashboard', value: analytics.revenueByPlatform.dashboard, color: '#8b5cf6' }
  ];

  const externalNetworkData = [
    { name: 'AdSense', value: analytics.externalNetworkRevenue.adsense, color: '#22c55e' },
    { name: 'Adstra', value: analytics.externalNetworkRevenue.adstra, color: '#ef4444' }
  ];

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
                <div className={`flex items-center text-xs mt-1 ${getGrowthColor(analytics.revenueGrowth)}`}>
                  {getGrowthIcon(analytics.revenueGrowth)}
                  <span className="ml-1">{Math.abs(analytics.revenueGrowth).toFixed(1)}% vs last month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.platformRevenue)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {((analytics.platformRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExternalLink className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">External Networks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.externalNetworkRevenue.adsense + analytics.externalNetworkRevenue.adstra)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  AdSense + Adstra
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Generators</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.topRevenueGenerators.length}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Active businesses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Revenue Trends
          </CardTitle>
          <CardDescription>
            Monthly revenue performance and growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22c55e" 
                  fill="#22c55e"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-blue-500" />
              Platform Revenue Distribution
            </CardTitle>
            <CardDescription>
              Revenue breakdown by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformRevenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {platformRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {platformRevenueData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-600">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(entry.value)}</p>
                    <p className="text-xs text-gray-500">
                      {((entry.value / analytics.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* External Network Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2 text-orange-500" />
              External Network Performance
            </CardTitle>
            <CardDescription>
              Revenue from external ad networks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* AdSense */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <span className="font-medium">Google AdSense</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Primary</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="font-semibold">{formatCurrency(analytics.externalNetworkRevenue.adsense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Share of External</span>
                    <span className="text-sm">
                      {(
                        (analytics.externalNetworkRevenue.adsense / 
                        (analytics.externalNetworkRevenue.adsense + analytics.externalNetworkRevenue.adstra)) * 100
                      ).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={
                      (analytics.externalNetworkRevenue.adsense / 
                      (analytics.externalNetworkRevenue.adsense + analytics.externalNetworkRevenue.adstra)) * 100
                    } 
                    className="h-2"
                  />
                </div>
              </div>

              {/* Adstra */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <span className="font-medium">Adstra Network</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">Secondary</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="font-semibold">{formatCurrency(analytics.externalNetworkRevenue.adstra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Share of External</span>
                    <span className="text-sm">
                      {(
                        (analytics.externalNetworkRevenue.adstra / 
                        (analytics.externalNetworkRevenue.adsense + analytics.externalNetworkRevenue.adstra)) * 100
                      ).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={
                      (analytics.externalNetworkRevenue.adstra / 
                      (analytics.externalNetworkRevenue.adsense + analytics.externalNetworkRevenue.adstra)) * 100
                    } 
                    className="h-2"
                  />
                </div>
              </div>

              {/* Total External Revenue */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total External Revenue</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(analytics.externalNetworkRevenue.adsense + analytics.externalNetworkRevenue.adstra)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {(((analytics.externalNetworkRevenue.adsense + analytics.externalNetworkRevenue.adstra) / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Revenue Generators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-500" />
            Top Revenue Generators
          </CardTitle>
          <CardDescription>
            Businesses contributing most to platform revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topRevenueGenerators && analytics.topRevenueGenerators.length > 0 ? (
            <div className="space-y-4">
              {analytics.topRevenueGenerators.slice(0, 10).map((generator, index) => (
                <div key={generator.business.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <span className="text-sm font-semibold text-purple-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{generator.business.businessName}</h4>
                      <p className="text-sm text-gray-600">{generator.business.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-semibold text-green-600">{formatCurrency(generator.revenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Campaigns</p>
                      <p className="font-semibold">{generator.campaigns}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Share</p>
                      <p className="font-semibold text-blue-600">
                        {((generator.revenue / analytics.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Tier</p>
                      <Badge variant="outline" className={
                        generator.business.verificationTier === 'premium' 
                          ? 'bg-purple-100 text-purple-800'
                          : generator.business.verificationTier === 'enhanced'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {generator.business.verificationTier}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Revenue Data</h3>
              <p className="text-gray-600">
                Revenue generator data will appear here once campaigns generate revenue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Growth Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-500" />
            Monthly Growth Analysis
          </CardTitle>
          <CardDescription>
            Month-over-month revenue growth trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Growth']}
                />
                <Bar 
                  dataKey="growth" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Performance Summary</CardTitle>
          <CardDescription>
            Key revenue metrics and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getGrowthColor(analytics.revenueGrowth)}`}>
                {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Revenue Growth</p>
              <div className="mt-2">
                {getGrowthIcon(analytics.revenueGrowth)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.revenueGrowth > 10 
                  ? 'Excellent Growth' 
                  : analytics.revenueGrowth > 0 
                  ? 'Positive Growth' 
                  : 'Needs Attention'
                }
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {((analytics.platformRevenue / analytics.totalRevenue) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Platform Revenue Share</p>
              <div className="mt-2">
                <Progress value={(analytics.platformRevenue / analytics.totalRevenue) * 100} className="h-2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                vs External Networks
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.topRevenueGenerators.length}
              </div>
              <p className="text-sm text-gray-600">Active Revenue Generators</p>
              <div className="mt-2">
                <Target className="h-5 w-5 text-purple-600 mx-auto" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Contributing Businesses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}