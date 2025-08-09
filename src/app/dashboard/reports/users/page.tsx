'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Activity,
  Clock
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { ChartContainer } from '@/components/analytics/chart-container';
import { MetricsCard } from '@/components/analytics/metrics-card';
import { DateRangePicker } from '@/components/analytics/date-range-picker';

interface UserReport {
  period: string;
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    verifiedUsers: number;
    suspendedUsers: number;
    deletedUsers: number;
  };
  trends: {
    userGrowth: number;
    activationRate: number;
    verificationRate: number;
    retentionRate: number;
  };
  charts: {
    registrations: Array<{ date: string; value: number; }>;
    activations: Array<{ date: string; value: number; }>;
    verifications: Array<{ date: string; value: number; }>;
  };
  breakdown: {
    byRole: Array<{ role: string; count: number; percentage: number; }>;
    byVerificationTier: Array<{ tier: string; count: number; percentage: number; }>;
    byRegion: Array<{ region: string; users: number; growth: number; }>;
    byRegistrationSource: Array<{ source: string; count: number; percentage: number; }>;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  cohortAnalysis: Array<{
    cohort: string;
    week0: number;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  }>;
}

export default function UserReportsPage() {
  const [report, setReport] = useState<UserReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'buyers' | 'sellers' | 'both'>('all');

  useEffect(() => {
    fetchUserReport();
  }, [dateRange, selectedSegment]);

  const fetchUserReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminApiClient.get('/reports/users', {
        params: {
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          segment: selectedSegment
        }
      });
      
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch user report:', error);
      setError('Failed to load user report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await adminApiClient.post('/reports/users/export', {
        format,
        segment: selectedSegment,
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString()
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-report-${dateRange.from.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchUserReport}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive user analytics and insights
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchUserReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExportReport('pdf')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={(from, to) => setDateRange({ from, to })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Segment:</span>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Users</option>
              <option value="buyers">Buyers Only</option>
              <option value="sellers">Sellers Only</option>
              <option value="both">Buyer & Seller</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key User Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Users"
          value={report.summary.totalUsers}
          change={report.trends.userGrowth}
          icon={Users}
          color="blue"
          subtitle={`${report.summary.activeUsers} active`}
        />
        <MetricsCard
          title="New Users"
          value={report.summary.newUsers}
          change={0}
          icon={UserPlus}
          color="green"
          subtitle="This period"
        />
        <MetricsCard
          title="Verified Users"
          value={report.summary.verifiedUsers}
          change={report.trends.verificationRate}
          icon={UserCheck}
          color="purple"
          subtitle={`${((report.summary.verifiedUsers / report.summary.totalUsers) * 100).toFixed(1)}% of total`}
        />
        <MetricsCard
          title="Retention Rate"
          value={`${report.trends.retentionRate}%`}
          change={0}
          icon={TrendingUp}
          color="yellow"
          subtitle="30-day retention"
        />
      </div>

      {/* User Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="User Registrations"
          subtitle="New user registrations over time"
          data={report.charts.registrations}
          type="line"
          color="blue"
        />
        <ChartContainer
          title="User Activations"
          subtitle="Users who completed first action"
          data={report.charts.activations}
          type="bar"
          color="green"
        />
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Role */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h3>
          <div className="space-y-3">
            {report.breakdown.byRole.map((role, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{role.role}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{role.count.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{role.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Verification Tier */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Tiers</h3>
          <div className="space-y-3">
            {report.breakdown.byVerificationTier.map((tier, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{tier.tier}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{tier.count.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{tier.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Registration Source */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Sources</h3>
          <div className="space-y-3">
            {report.breakdown.byRegistrationSource.map((source, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{source.source}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{source.count.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{source.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {report.engagement.dailyActiveUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Daily Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {report.engagement.weeklyActiveUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Weekly Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {report.engagement.monthlyActiveUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Monthly Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(report.engagement.averageSessionDuration / 60)}m
            </div>
            <div className="text-sm text-gray-500">Avg Session Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {report.engagement.bounceRate}%
            </div>
            <div className="text-sm text-gray-500">Bounce Rate</div>
          </div>
        </div>
      </div>

      {/* Regional Distribution */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.breakdown.byRegion.slice(0, 6).map((region, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{region.region}</div>
                <div className="text-sm text-gray-500">{region.users.toLocaleString()} users</div>
              </div>
              <div className={`text-sm font-medium ${
                region.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {region.growth >= 0 ? '+' : ''}{region.growth}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort Analysis */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Retention Cohort Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cohort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week 0
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week 3
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week 4
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.cohortAnalysis.map((cohort, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cohort.cohort}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cohort.week0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cohort.week1}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cohort.week2}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cohort.week3}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cohort.week4}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}