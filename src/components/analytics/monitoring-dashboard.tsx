'use client';

import { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Server, 
  Database,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { adminApiClient } from '@/lib/api/admin-client';
import { RealtimeMetrics, PerformanceMetrics } from '@/types';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface MonitoringDashboardProps {
  refreshInterval?: number;
}

export function MonitoringDashboard({ refreshInterval = 30000 }: MonitoringDashboardProps) {
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchMonitoringData();
    
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchMonitoringData = async () => {
    try {
      const [realtimeResponse, performanceResponse, alertsResponse] = await Promise.all([
        adminApiClient.getRealtimeMetrics(),
        adminApiClient.getPerformanceMetrics(),
        adminApiClient.get('/monitoring/alerts')
      ]);

      setRealtimeMetrics(realtimeResponse.data);
      setPerformanceMetrics(performanceResponse.data);
      setAlerts(alertsResponse.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await adminApiClient.post(`/monitoring/alerts/${alertId}/acknowledge`);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getHealthStatus = () => {
    if (!realtimeMetrics || !performanceMetrics) return 'unknown';
    
    const { systemHealth } = realtimeMetrics;
    const { apiMetrics } = performanceMetrics;
    
    if (systemHealth.uptime < 99 || apiMetrics.errorRate > 5) return 'critical';
    if (systemHealth.uptime < 99.5 || apiMetrics.errorRate > 2) return 'warning';
    return 'healthy';
  };

  const healthStatus = getHealthStatus();
  const healthColors = {
    healthy: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    critical: 'text-red-600 bg-red-100',
    unknown: 'text-gray-600 bg-gray-100'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">System Monitoring</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${healthColors[healthStatus]}`}>
            {healthStatus === 'healthy' && <CheckCircle className="h-4 w-4 inline mr-1" />}
            {healthStatus === 'warning' && <AlertTriangle className="h-4 w-4 inline mr-1" />}
            {healthStatus === 'critical' && <AlertTriangle className="h-4 w-4 inline mr-1" />}
            System {healthStatus}
          </div>
          <button
            onClick={fetchMonitoringData}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Realtime Metrics */}
      {realtimeMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {realtimeMetrics.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Orders Today</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {realtimeMetrics.ordersToday.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenue Today</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{realtimeMetrics.revenueToday.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Disputes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {realtimeMetrics.pendingDisputes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2" />
              API Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Response Time</span>
                <span className="text-sm font-medium">
                  {performanceMetrics.apiMetrics.averageResponseTime}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Error Rate</span>
                <span className={`text-sm font-medium ${
                  performanceMetrics.apiMetrics.errorRate > 2 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {performanceMetrics.apiMetrics.errorRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requests/sec</span>
                <span className="text-sm font-medium">
                  {performanceMetrics.apiMetrics.requestsPerSecond}
                </span>
              </div>
            </div>
          </div>

          {/* Database Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Query Time</span>
                <span className="text-sm font-medium">
                  {performanceMetrics.databaseMetrics.queryTime}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Connection Pool</span>
                <span className="text-sm font-medium">
                  {performanceMetrics.databaseMetrics.connectionPool}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Slow Queries</span>
                <span className="text-sm font-medium">
                  {performanceMetrics.databaseMetrics.slowQueries.length}
                </span>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              System Resources
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">CPU Usage</span>
                <span className={`text-sm font-medium ${
                  performanceMetrics.systemMetrics.cpuUsage > 80 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {performanceMetrics.systemMetrics.cpuUsage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Memory Usage</span>
                <span className={`text-sm font-medium ${
                  performanceMetrics.systemMetrics.memoryUsage > 80 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {performanceMetrics.systemMetrics.memoryUsage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Disk Usage</span>
                <span className={`text-sm font-medium ${
                  performanceMetrics.systemMetrics.diskUsage > 80 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {performanceMetrics.systemMetrics.diskUsage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {alerts.filter(alert => !alert.acknowledged).map((alert) => (
              <div key={alert.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 ${
                      alert.type === 'error' ? 'text-red-500' :
                      alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-500">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="ml-4 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}