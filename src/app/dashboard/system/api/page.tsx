'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Server,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

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

const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    ></div>
  </div>
);

const Tabs = ({ defaultValue, className, children }: {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, {
          ...(child.props || {}),
          activeTab,
          setActiveTab
        }) : child
      )}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab }: {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}) => (
  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
    {React.Children.map(children, child =>
      React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, {
        ...(child.props || {}),
        activeTab,
        setActiveTab
      }) : child
    )}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, setActiveTab }: {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}) => (
  <button
    onClick={() => setActiveTab?.(value)}
    className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === value
      ? 'bg-white text-gray-900 shadow-sm'
      : 'text-gray-500 hover:text-gray-700'
      }`}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeTab }: {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
}) => (
  activeTab === value ? <div>{children}</div> : null
);

interface ApiEndpoint {
  id: string;
  path: string;
  method: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  requestCount: number;
  errorRate: number;
  lastChecked: string;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface ApiStats {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export default function SystemApiPage() {
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [apiStats, setApiStats] = useState<ApiStats>({
    totalRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    uptime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real implementation, this would fetch from monitoring APIs
    const mockEndpoints: ApiEndpoint[] = [
      {
        id: '1',
        path: '/api/auth/login',
        method: 'POST',
        status: 'healthy',
        responseTime: 120,
        requestCount: 1250,
        errorRate: 0.2,
        lastChecked: new Date().toISOString(),
      },
      {
        id: '2',
        path: '/api/products',
        method: 'GET',
        status: 'healthy',
        responseTime: 85,
        requestCount: 3420,
        errorRate: 0.1,
        lastChecked: new Date().toISOString(),
      },
      {
        id: '3',
        path: '/api/orders',
        method: 'POST',
        status: 'warning',
        responseTime: 450,
        requestCount: 890,
        errorRate: 2.1,
        lastChecked: new Date().toISOString(),
      },
      {
        id: '4',
        path: '/api/users',
        method: 'GET',
        status: 'healthy',
        responseTime: 95,
        requestCount: 2100,
        errorRate: 0.3,
        lastChecked: new Date().toISOString(),
      },
      {
        id: '5',
        path: '/api/payments/webhook',
        method: 'POST',
        status: 'error',
        responseTime: 1200,
        requestCount: 45,
        errorRate: 15.6,
        lastChecked: new Date().toISOString(),
      },
    ];

    const mockMetrics: SystemMetric[] = [
      {
        name: 'CPU Usage',
        value: 65,
        unit: '%',
        status: 'warning',
        trend: 'up',
      },
      {
        name: 'Memory Usage',
        value: 78,
        unit: '%',
        status: 'warning',
        trend: 'stable',
      },
      {
        name: 'Disk Usage',
        value: 45,
        unit: '%',
        status: 'good',
        trend: 'up',
      },
      {
        name: 'Database Connections',
        value: 23,
        unit: 'active',
        status: 'good',
        trend: 'stable',
      },
      {
        name: 'Redis Memory',
        value: 156,
        unit: 'MB',
        status: 'good',
        trend: 'down',
      },
      {
        name: 'Queue Size',
        value: 12,
        unit: 'jobs',
        status: 'good',
        trend: 'down',
      },
    ];

    setApiEndpoints(mockEndpoints);
    setSystemMetrics(mockMetrics);

    // Calculate stats
    const totalRequests = mockEndpoints.reduce((sum, endpoint) => sum + endpoint.requestCount, 0);
    const averageResponseTime = mockEndpoints.reduce((sum, endpoint) => sum + endpoint.responseTime, 0) / mockEndpoints.length;
    const totalErrors = mockEndpoints.reduce((sum, endpoint) => sum + (endpoint.requestCount * endpoint.errorRate / 100), 0);
    const errorRate = (totalErrors / totalRequests) * 100;

    setApiStats({
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: 99.8,
    });

    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      healthy: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      good: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.healthy;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatResponseTime = (time: number) => {
    return `${time}ms`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
        <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
        <p className="text-gray-600">
          Monitor API performance, system health, and infrastructure metrics.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{apiStats.totalRequests.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{apiStats.averageResponseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold">{apiStats.errorRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold">{apiStats.uptime}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="system">System Metrics</TabsTrigger>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Error Rate</TableHead>
                      <TableHead>Last Checked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiEndpoints.map((endpoint) => (
                      <TableRow key={endpoint.id}>
                        <TableCell className="font-mono text-sm">
                          {endpoint.path}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{endpoint.method}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(endpoint.status)}
                        </TableCell>
                        <TableCell className={
                          endpoint.responseTime > 500 ? 'text-red-600 font-medium' :
                            endpoint.responseTime > 200 ? 'text-yellow-600 font-medium' :
                              'text-green-600 font-medium'
                        }>
                          {formatResponseTime(endpoint.responseTime)}
                        </TableCell>
                        <TableCell>{endpoint.requestCount.toLocaleString()}</TableCell>
                        <TableCell className={
                          endpoint.errorRate > 5 ? 'text-red-600 font-medium' :
                            endpoint.errorRate > 1 ? 'text-yellow-600 font-medium' :
                              'text-green-600 font-medium'
                        }>
                          {endpoint.errorRate}%
                        </TableCell>
                        <TableCell>{formatDate(endpoint.lastChecked)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Database className="h-6 w-6 text-blue-600 mr-2" />
                      <h3 className="font-medium">{metric.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      {getStatusBadge(metric.status)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold">
                        {metric.value} {metric.unit}
                      </span>
                    </div>
                    {metric.unit === '%' && (
                      <Progress
                        value={metric.value}
                        className="h-2"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                  <div className="text-green-600">[2025-01-08 10:30:15] INFO: API health check completed successfully</div>
                  <div className="text-blue-600">[2025-01-08 10:29:45] INFO: Database connection pool optimized</div>
                  <div className="text-yellow-600">[2025-01-08 10:29:12] WARN: High response time detected on /api/orders endpoint</div>
                  <div className="text-red-600">[2025-01-08 10:28:33] ERROR: Payment webhook timeout - retrying</div>
                  <div className="text-green-600">[2025-01-08 10:28:01] INFO: Cache cleared successfully</div>
                  <div className="text-blue-600">[2025-01-08 10:27:45] INFO: Background job queue processed 150 jobs</div>
                  <div className="text-green-600">[2025-01-08 10:27:12] INFO: System backup completed</div>
                  <div className="text-yellow-600">[2025-01-08 10:26:55] WARN: Memory usage above 75% threshold</div>
                </div>
                <Button variant="outline" className="w-full">
                  Load More Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}