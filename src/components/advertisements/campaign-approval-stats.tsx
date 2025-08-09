'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdApprovalStats } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  AlertTriangle,
  Timer,
  Activity
} from 'lucide-react';

interface CampaignApprovalStatsProps {
  stats: AdApprovalStats | null;
}

export function CampaignApprovalStats({ stats }: CampaignApprovalStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalProcessed = stats.totalApproved + stats.totalRejected;
  const approvalRate = totalProcessed > 0 ? (stats.totalApproved / totalProcessed) * 100 : 0;
  const rejectionRate = totalProcessed > 0 ? (stats.totalRejected / totalProcessed) * 100 : 0;

  const formatReviewTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPending}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Awaiting admin action
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved Campaigns */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApproved}</p>
                <p className="text-xs text-green-600 mt-1">
                  {approvalRate.toFixed(1)}% approval rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rejected Campaigns */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRejected}</p>
                <p className="text-xs text-red-600 mt-1">
                  {rejectionRate.toFixed(1)}% rejection rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Review Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Timer className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatReviewTime(stats.averageReviewTime)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Per campaign
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Pending by Priority
            </CardTitle>
            <CardDescription>
              Campaign distribution by priority level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-red-100 text-red-800 mr-2">High</Badge>
                  <span className="text-sm text-gray-600">Urgent campaigns</span>
                </div>
                <span className="font-semibold">{stats.pendingByPriority.high}</span>
              </div>
              <Progress 
                value={(stats.pendingByPriority.high / stats.totalPending) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-yellow-100 text-yellow-800 mr-2">Medium</Badge>
                  <span className="text-sm text-gray-600">Standard campaigns</span>
                </div>
                <span className="font-semibold">{stats.pendingByPriority.medium}</span>
              </div>
              <Progress 
                value={(stats.pendingByPriority.medium / stats.totalPending) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-green-100 text-green-800 mr-2">Low</Badge>
                  <span className="text-sm text-gray-600">Regular campaigns</span>
                </div>
                <span className="font-semibold">{stats.pendingByPriority.low}</span>
              </div>
              <Progress 
                value={(stats.pendingByPriority.low / stats.totalPending) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Last 24 hours activity summary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-900">Approved</p>
                  <p className="text-sm text-green-700">Campaigns approved today</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-900">
                {stats.recentActivity.approved}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-900">Rejected</p>
                  <p className="text-sm text-red-700">Campaigns rejected today</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-900">
                {stats.recentActivity.rejected}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">Submitted</p>
                  <p className="text-sm text-blue-700">New submissions today</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-900">
                {stats.recentActivity.submitted}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Review Performance</CardTitle>
          <CardDescription>
            Key performance indicators for the approval process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {approvalRate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Approval Rate</p>
              <div className="mt-2">
                <Progress value={approvalRate} className="h-2" />
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {formatReviewTime(stats.averageReviewTime)}
              </div>
              <p className="text-sm text-gray-600">Avg Review Time</p>
              <div className="mt-2">
                <div className={`text-xs ${
                  stats.averageReviewTime < 24 
                    ? 'text-green-600' 
                    : stats.averageReviewTime < 48 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {stats.averageReviewTime < 24 
                    ? 'Excellent' 
                    : stats.averageReviewTime < 48 
                    ? 'Good' 
                    : 'Needs Improvement'
                  }
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.totalPending}
              </div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <div className="mt-2">
                <div className={`text-xs ${
                  stats.totalPending < 10 
                    ? 'text-green-600' 
                    : stats.totalPending < 25 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {stats.totalPending < 10 
                    ? 'Low Queue' 
                    : stats.totalPending < 25 
                    ? 'Moderate Queue' 
                    : 'High Queue'
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}