'use client';

import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  CreditCard,
  Wallet,
  PieChart
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { ChartContainer } from '@/components/analytics/chart-container';
import { MetricsCard } from '@/components/analytics/metrics-card';
import { DateRangePicker } from '@/components/analytics/date-range-picker';

interface FinancialReport {
  period: string;
  summary: {
    totalRevenue: number;
    platformCommission: number;
    sellerPayouts: number;
    refunds: number;
    chargebacks: number;
    netRevenue: number;
  };
  trends: {
    revenueGrowth: number;
    commissionGrowth: number;
    payoutGrowth: number;
  };
  charts: {
    revenue: Array<{ date: string; value: number; }>;
    commission: Array<{ date: string; value: number; }>;
    payouts: Array<{ date: string; value: number; }>;
  };
  breakdown: {
    byCategory: Array<{ category: string; revenue: number; commission: number; }>;
    byRegion: Array<{ region: string; revenue: number; orders: number; }>;
    byPaymentMethod: Array<{ method: string; volume: number; percentage: number; }>;
  };
  settlements: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export default function FinancialReportsPage() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [reportType, setReportType] = useState<'revenue' | 'commission' | 'settlement' | 'all'>('all');

  useEffect(() => {
    fetchFinancialReport();
  }, [dateRange, reportType]);

  const fetchFinancialReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminApiClient.getFinancialReports({
        type: reportType,
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString()
      });
      
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch financial report:', error);
      setError('Failed to load financial report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await adminApiClient.post('/reports/financial/export', {
        format,
        type: reportType,
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString()
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${dateRange.from.toISOString().split('T')[0]}.${format}`;
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
                onClick={fetchFinancialReport}
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
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive financial analytics and reporting
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchFinancialReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <div className="relative">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="all">All Reports</option>
              <option value="revenue">Revenue Only</option>
              <option value="commission">Commission Only</option>
              <option value="settlement">Settlements Only</option>
            </select>
          </div>
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
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Revenue"
          value={`₹${report.summary.totalRevenue.toLocaleString()}`}
          change={report.trends.revenueGrowth}
          icon={DollarSign}
          color="green"
          subtitle="Gross platform revenue"
        />
        <MetricsCard
          title="Platform Commission"
          value={`₹${report.summary.platformCommission.toLocaleString()}`}
          change={report.trends.commissionGrowth}
          icon={CreditCard}
          color="blue"
          subtitle="Commission earned"
        />
        <MetricsCard
          title="Seller Payouts"
          value={`₹${report.summary.sellerPayouts.toLocaleString()}`}
          change={report.trends.payoutGrowth}
          icon={Wallet}
          color="purple"
          subtitle="Paid to sellers"
        />
        <MetricsCard
          title="Net Revenue"
          value={`₹${report.summary.netRevenue.toLocaleString()}`}
          change={0}
          icon={TrendingUp}
          color="yellow"
          subtitle="After refunds & chargebacks"
        />
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Revenue Trends"
          subtitle="Total platform revenue over time"
          data={report.charts.revenue}
          type="area"
          color="green"
        />
        <ChartContainer
          title="Commission Trends"
          subtitle="Platform commission over time"
          data={report.charts.commission}
          type="line"
          color="blue"
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h3>
          <div className="space-y-3">
            {report.breakdown.byCategory.slice(0, 5).map((category, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{category.category}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">₹{category.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">₹{category.commission.toLocaleString()} commission</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Region</h3>
          <div className="space-y-3">
            {report.breakdown.byRegion.slice(0, 5).map((region, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{region.region}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">₹{region.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{region.orders} orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {report.breakdown.byPaymentMethod.map((method, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{method.method}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">₹{method.volume.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{method.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settlement Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Settlement Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              ₹{report.settlements.pending.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ₹{report.settlements.processing.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ₹{report.settlements.completed.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              ₹{report.settlements.failed.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>
      </div>

      {/* Additional Financial Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Health Indicators</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Refund Rate</span>
              <span className="text-sm font-medium">
                {((report.summary.refunds / report.summary.totalRevenue) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Chargeback Rate</span>
              <span className="text-sm font-medium">
                {((report.summary.chargebacks / report.summary.totalRevenue) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Rate</span>
              <span className="text-sm font-medium">
                {((report.summary.platformCommission / report.summary.totalRevenue) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Net Margin</span>
              <span className="text-sm font-medium">
                {((report.summary.netRevenue / report.summary.totalRevenue) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className={`text-sm font-medium flex items-center ${
                report.trends.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {report.trends.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(report.trends.revenueGrowth)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Growth</span>
              <span className={`text-sm font-medium flex items-center ${
                report.trends.commissionGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {report.trends.commissionGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(report.trends.commissionGrowth)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payout Growth</span>
              <span className={`text-sm font-medium flex items-center ${
                report.trends.payoutGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {report.trends.payoutGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(report.trends.payoutGrowth)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}