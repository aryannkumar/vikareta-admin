'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AdSystemHealth } from '@/types';
import { 
  Activity, 
  Shield, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Server,
  Database,
  ExternalLink,
  TrendingUp,
  Gauge,
  Wifi,
  Lock
} from 'lucide-react';

interface AdSystemHealthProps {
  health: AdSystemHealth | null;
}

export function AdSystemHealth({ health }: AdSystemHealthProps) {
  if (!health) {
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

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return { status: 'healthy', color: 'text-green-600', bg: 'bg-green-100' };
    if (value >= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'down') => {
    const config = {
      healthy: { color: 'bg-green-100 text-green-800', label: 'Healthy' },
      degraded: { color: 'bg-yellow-100 text-yellow-800', label: 'Degraded' },
      down: { color: 'bg-red-100 text-red-800', label: 'Down' }
    };
    
    const { color, label } = config[status];
    return <Badge className={color}>{label}</Badge>;
  };

  const successRateHealth = getHealthStatus(health.adServingPerformance.successRate * 100, { good: 99, warning: 95 });
  const responseTimeHealth = getHealthStatus(health.adServingPerformance.averageResponseTime, { good: 100, warning: 200 });
  const errorRateHealth = getHealthStatus((1 - health.adServingPerformance.errorRate) * 100, { good: 99, warning: 95 });

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${successRateHealth.bg}`}>
                <Activity className={`h-6 w-6 ${successRateHealth.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(health.adServingPerformance.successRate * 100).toFixed(2)}%
                </p>
                <p className={`text-xs mt-1 ${successRateHealth.color}`}>
                  {successRateHealth.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${responseTimeHealth.bg}`}>
                <Clock className={`h-6 w-6 ${responseTimeHealth.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {health.adServingPerformance.averageResponseTime}ms
                </p>
                <p className={`text-xs mt-1 ${responseTimeHealth.color}`}>
                  {responseTimeHealth.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${errorRateHealth.bg}`}>
                <Shield className={`h-6 w-6 ${errorRateHealth.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(health.adServingPerformance.errorRate * 100).toFixed(2)}%
                </p>
                <p className={`text-xs mt-1 ${errorRateHealth.color}`}>
                  {errorRateHealth.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Requests/sec</p>
                <p className="text-2xl font-bold text-gray-900">
                  {health.adServingPerformance.requestsPerSecond.toFixed(1)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Current load
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {(health.adServingPerformance.successRate < 0.95 || 
        health.adServingPerformance.averageResponseTime > 200 ||
        health.adServingPerformance.errorRate > 0.05) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System performance is below optimal levels. 
            {health.adServingPerformance.successRate < 0.95 && ' Success rate is low.'}
            {health.adServingPerformance.averageResponseTime > 200 && ' Response time is high.'}
            {health.adServingPerformance.errorRate > 0.05 && ' Error rate is elevated.'}
            Consider investigating system resources and external dependencies.
          </AlertDescription>
        </Alert>
      )}

      {/* Ad Serving Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-blue-500" />
            Ad Serving Performance
          </CardTitle>
          <CardDescription>
            Real-time performance metrics for ad serving system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Success Rate</span>
                  <span className={`text-sm font-semibold ${successRateHealth.color}`}>
                    {(health.adServingPerformance.successRate * 100).toFixed(2)}%
                  </span>
                </div>
                <Progress value={health.adServingPerformance.successRate * 100} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">Target: ≥99%</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Response Time</span>
                  <span className={`text-sm font-semibold ${responseTimeHealth.color}`}>
                    {health.adServingPerformance.averageResponseTime}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min((500 - health.adServingPerformance.averageResponseTime) / 500 * 100, 100)} 
                  className="h-2" 
                />
                <p className="text-xs text-gray-500 mt-1">Target: ≤100ms</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Error Rate</span>
                  <span className={`text-sm font-semibold ${errorRateHealth.color}`}>
                    {(health.adServingPerformance.errorRate * 100).toFixed(2)}%
                  </span>
                </div>
                <Progress value={(1 - health.adServingPerformance.errorRate) * 100} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">Target: ≤1%</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Request Volume</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {health.adServingPerformance.requestsPerSecond.toFixed(1)}/sec
                  </span>
                </div>
                <Progress value={Math.min(health.adServingPerformance.requestsPerSecond / 100 * 100, 100)} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">Current load level</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-green-500" />
            Budget System Health
          </CardTitle>
          <CardDescription>
            Wallet and budget management system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget Locking</h3>
              <p className="text-2xl font-bold text-green-600 mb-1">
                {(health.budgetSystemHealth.lockingSuccessRate * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
              <Progress value={health.budgetSystemHealth.lockingSuccessRate * 100} className="h-2 mt-2" />
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <Gauge className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Deduction Accuracy</h3>
              <p className="text-2xl font-bold text-blue-600 mb-1">
                {(health.budgetSystemHealth.deductionAccuracy * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Accuracy Rate</p>
              <Progress value={health.budgetSystemHealth.deductionAccuracy * 100} className="h-2 mt-2" />
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lock Time</h3>
              <p className="text-2xl font-bold text-orange-600 mb-1">
                {health.budgetSystemHealth.averageLockTime}ms
              </p>
              <p className="text-sm text-gray-600">Average Time</p>
              <div className="mt-2">
                <p className={`text-xs ${
                  health.budgetSystemHealth.averageLockTime < 100 
                    ? 'text-green-600' 
                    : health.budgetSystemHealth.averageLockTime < 500 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {health.budgetSystemHealth.averageLockTime < 100 
                    ? 'Excellent' 
                    : health.budgetSystemHealth.averageLockTime < 500 
                    ? 'Good' 
                    : 'Needs Attention'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="h-5 w-5 mr-2 text-purple-500" />
            External Network Status
          </CardTitle>
          <CardDescription>
            Health and performance of external ad networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AdSense Status */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Google AdSense</h3>
                </div>
                {getStatusBadge(health.externalNetworkStatus.adsense.status)}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center">
                    {getStatusIcon(health.externalNetworkStatus.adsense.status)}
                    <span className="ml-2 text-sm font-medium">
                      {health.externalNetworkStatus.adsense.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium">
                    {health.externalNetworkStatus.adsense.responseTime}ms
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="text-sm font-medium">
                    {(health.externalNetworkStatus.adsense.errorRate * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Performance</span>
                    <span className="text-xs text-gray-500">
                      {health.externalNetworkStatus.adsense.status === 'healthy' ? 'Optimal' : 'Degraded'}
                    </span>
                  </div>
                  <Progress 
                    value={health.externalNetworkStatus.adsense.status === 'healthy' ? 100 : 
                           health.externalNetworkStatus.adsense.status === 'degraded' ? 60 : 0} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>

            {/* Adstra Status */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Adstra Network</h3>
                </div>
                {getStatusBadge(health.externalNetworkStatus.adstra.status)}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center">
                    {getStatusIcon(health.externalNetworkStatus.adstra.status)}
                    <span className="ml-2 text-sm font-medium">
                      {health.externalNetworkStatus.adstra.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium">
                    {health.externalNetworkStatus.adstra.responseTime}ms
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="text-sm font-medium">
                    {(health.externalNetworkStatus.adstra.errorRate * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Performance</span>
                    <span className="text-xs text-gray-500">
                      {health.externalNetworkStatus.adstra.status === 'healthy' ? 'Optimal' : 'Degraded'}
                    </span>
                  </div>
                  <Progress 
                    value={health.externalNetworkStatus.adstra.status === 'healthy' ? 100 : 
                           health.externalNetworkStatus.adstra.status === 'degraded' ? 60 : 0} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fraud Detection Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-red-500" />
            Fraud Detection System
          </CardTitle>
          <CardDescription>
            Security and fraud prevention system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Total Checks</h3>
              <p className="text-2xl font-bold text-blue-600 mb-1">
                {health.fraudDetectionMetrics.totalChecks.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Security Scans</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fraud Detected</h3>
              <p className="text-2xl font-bold text-red-600 mb-1">
                {health.fraudDetectionMetrics.fraudDetected.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {((health.fraudDetectionMetrics.fraudDetected / health.fraudDetectionMetrics.totalChecks) * 100).toFixed(2)}% of total
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">False Positive Rate</h3>
              <p className="text-2xl font-bold text-green-600 mb-1">
                {(health.fraudDetectionMetrics.falsePositiveRate * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600">Accuracy Metric</p>
              <Progress value={(1 - health.fraudDetectionMetrics.falsePositiveRate) * 100} className="h-2 mt-2" />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Fraud Detection Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Detection Rate:</p>
                <p className="font-semibold">
                  {((health.fraudDetectionMetrics.fraudDetected / health.fraudDetectionMetrics.totalChecks) * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">System Accuracy:</p>
                <p className="font-semibold">
                  {((1 - health.fraudDetectionMetrics.falsePositiveRate) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall System Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Summary</CardTitle>
          <CardDescription>
            Overall system performance and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${successRateHealth.color}`}>
                {(health.adServingPerformance.successRate * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Overall Success Rate</p>
              <div className="mt-2">
                <Progress value={health.adServingPerformance.successRate * 100} className="h-2" />
              </div>
              <p className={`text-xs mt-1 ${successRateHealth.color}`}>
                {successRateHealth.status}
              </p>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${responseTimeHealth.color}`}>
                {health.adServingPerformance.averageResponseTime}ms
              </div>
              <p className="text-sm text-gray-600">Average Response Time</p>
              <div className="mt-2">
                <Clock className={`h-5 w-5 mx-auto ${responseTimeHealth.color}`} />
              </div>
              <p className={`text-xs mt-1 ${responseTimeHealth.color}`}>
                {responseTimeHealth.status}
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {health.adServingPerformance.requestsPerSecond.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">Requests per Second</p>
              <div className="mt-2">
                <Wifi className="h-5 w-5 text-blue-600 mx-auto" />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Current Load
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}