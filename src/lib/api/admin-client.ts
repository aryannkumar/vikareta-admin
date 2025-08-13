import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getApiUrl } from '@/config/api';

// Use production API URL as fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.vikareta.com/api';

class AdminApiClient {
  private client: AxiosInstance;
  private csrfClient: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/admin`,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Separate client for CSRF token and auth requests to maintain session
    // The CSRF endpoint is at the root level, not under /api
    const baseUrl = API_BASE_URL.replace('/api', '');
    console.log('CSRF client base URL:', baseUrl);
    this.csrfClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and CSRF token
    this.client.interceptors.request.use(
      async (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('admin_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // Add CSRF token for non-GET requests
          if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
            const csrfToken = localStorage.getItem('csrf_token');
            if (csrfToken) {
              config.headers['X-CSRF-Token'] = csrfToken;
            }
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth and CSRF errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 403 CSRF token errors
        if (error.response?.status === 403 && !originalRequest._csrfRetry) {
          const errorData = error.response?.data;
          const message = errorData?.error?.message || errorData?.message || '';

          if (message.includes('CSRF') || message.includes('csrf')) {
            console.log('CSRF token expired, clearing and retrying...');
            originalRequest._csrfRetry = true;

            // Clear old token and get fresh one
            localStorage.removeItem('csrf_token');
            await this.ensureCSRFToken();

            const csrfToken = localStorage.getItem('csrf_token');
            if (csrfToken) {
              originalRequest.headers['X-CSRF-Token'] = csrfToken;
            }

            return this.client(originalRequest);
          }
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('admin_refresh_token');

            if (refreshToken) {
              try {
                // Try to refresh the token
                const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                  refreshToken
                });

                const { accessToken } = refreshResponse.data.data.tokens;
                localStorage.setItem('admin_token', accessToken);

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.client(originalRequest);
              } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_refresh_token');
                window.location.href = '/login';
              }
            } else {
              // No refresh token, redirect to login
              localStorage.removeItem('admin_token');
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Handle auth requests specially - they should go to /api/auth, not /api/admin/auth
    if (url.startsWith('/auth/')) {
      return this.authRequest('get', url, null, config);
    }
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Handle auth requests specially - they should go to /api/auth, not /api/admin/auth
    if (url.startsWith('/auth/')) {
      return this.authRequest('post', url, data, config);
    }
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  private async authRequest<T = any>(method: 'get' | 'post', url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Get CSRF token first for non-GET auth requests
    if (method !== 'get') {
      await this.ensureCSRFToken();
    }

    // Use the same client that fetched the CSRF token to maintain session
    const authClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add tokens to auth requests
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        authClient.defaults.headers.Authorization = `Bearer ${token}`;
      }

      if (method !== 'get') {
        const csrfToken = localStorage.getItem('csrf_token');
        if (csrfToken) {
          authClient.defaults.headers['X-CSRF-Token'] = csrfToken;
          console.log('Adding CSRF token to auth request:', csrfToken.substring(0, 10) + '...');
        } else {
          console.warn('No CSRF token available for auth request');
        }
      }
    }

    console.log('Making auth request:', method.toUpperCase(), `${API_BASE_URL}${url}`);
    console.log('Request headers:', authClient.defaults.headers);
    console.log('Request data:', data);

    if (method === 'get') {
      return authClient.get(url, config);
    } else {
      return authClient.post(url, data, config);
    }
  }

  private async ensureCSRFToken(): Promise<void> {
    if (typeof window !== 'undefined') {
      const existingToken = localStorage.getItem('csrf_token');
      if (!existingToken) {
        try {
          console.log('Fetching CSRF token from:', '/csrf-token');
          const response = await this.csrfClient.get('/csrf-token');
          console.log('CSRF response:', response.data);

          // Handle different response structures
          let csrfToken;
          if (response.data?.data?.csrfToken) {
            csrfToken = response.data.data.csrfToken;
          } else if (response.data?.csrfToken) {
            csrfToken = response.data.csrfToken;
          } else {
            console.error('Unexpected CSRF response structure:', response.data);
            return; // Don't throw error, just continue without CSRF token
          }

          localStorage.setItem('csrf_token', csrfToken);
          console.log('CSRF token fetched and stored:', csrfToken.substring(0, 10) + '...');
        } catch (error) {
          console.error('Failed to get CSRF token:', error);
          // Don't throw error, just continue without CSRF token for now
        }
      } else {
        console.log('Using existing CSRF token:', existingToken.substring(0, 10) + '...');
      }
    }
  }

  // Special login method that handles CSRF token in one go
  async loginWithCSRF(email: string, password: string): Promise<AxiosResponse<any>> {
    try {
      // First, get a fresh CSRF token directly from the correct URL
      console.log('Fetching fresh CSRF token for login...');
      const csrfUrl = 'https://api.vikareta.com/csrf-token';
      console.log('CSRF URL:', csrfUrl);

      const csrfResponse = await axios.get(csrfUrl, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('CSRF response:', csrfResponse.data);

      // Handle different response structures
      let csrfToken;
      if (csrfResponse.data?.data?.csrfToken) {
        csrfToken = csrfResponse.data.data.csrfToken;
      } else if (csrfResponse.data?.csrfToken) {
        csrfToken = csrfResponse.data.csrfToken;
      } else {
        console.error('Unexpected CSRF response structure:', csrfResponse.data);
        throw new Error('Could not extract CSRF token from response');
      }

      console.log('Got CSRF token:', csrfToken.substring(0, 10) + '...');

      // Now make the login request with the same session
      const loginUrl = 'https://api.vikareta.com/api/auth/login';
      console.log('Login URL:', loginUrl);

      const loginResponse = await axios.post(loginUrl, {
        email,
        password,
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      // Store the token for future use
      localStorage.setItem('csrf_token', csrfToken);

      return loginResponse;
    } catch (error) {
      console.error('Login with CSRF failed:', error);
      throw error;
    }
  }

  // Admin-specific methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    return this.get('/users', { params });
  }

  async getUserById(id: string) {
    return this.get(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.put(`/users/${id}`, data);
  }

  async verifyUser(id: string, verificationData: any) {
    return this.post(`/users/${id}/verify`, verificationData);
  }

  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) {
    return this.get('/products', { params });
  }

  async approveProduct(id: string) {
    return this.post(`/products/${id}/approve`);
  }

  async rejectProduct(id: string, reason: string) {
    return this.post(`/products/${id}/reject`, { reason });
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get('/orders', { params });
  }

  async getTransactions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get('/transactions', { params });
  }

  async getAnalytics(params?: {
    period?: string;
    metrics?: string[];
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get('/analytics', { params });
  }

  async getDetailedAnalytics(params?: {
    period?: string;
    metrics?: string[];
    dateFrom?: string;
    dateTo?: string;
    breakdown?: string;
  }) {
    return this.get('/analytics/detailed', { params });
  }

  async getRealtimeMetrics() {
    return this.get('/analytics/realtime');
  }

  async getPerformanceMetrics(params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get('/analytics/performance', { params });
  }

  async getBusinessIntelligence(params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
    categories?: string[];
  }) {
    return this.get('/analytics/business-intelligence', { params });
  }

  async generateReport(config: {
    format: 'pdf' | 'excel' | 'csv';
    includeCharts: boolean;
    includeRawData: boolean;
    sections: string[];
    dateRange: { from: Date; to: Date };
    selectedMetrics: string[];
    data: any;
  }) {
    return this.post('/reports/generate', config, {
      responseType: 'blob'
    });
  }

  async getFinancialReports(params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: 'revenue' | 'commission' | 'settlement' | 'all';
  }) {
    return this.get('/reports/financial', { params });
  }

  async getSettlementReports(params?: {
    dateFrom?: string;
    dateTo?: string;
    sellerId?: string;
    status?: string;
  }) {
    return this.get('/reports/settlements', { params });
  }

  // Monitoring and Alerting
  async getMonitoringAlerts(params?: {
    type?: string;
    acknowledged?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get('/monitoring/alerts', { params });
  }

  async acknowledgeAlert(alertId: string) {
    return this.post(`/monitoring/alerts/${alertId}/acknowledge`);
  }

  async createAlert(alert: {
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    metadata?: any;
  }) {
    return this.post('/monitoring/alerts', alert);
  }

  async getSystemHealth() {
    return this.get('/monitoring/health');
  }

  async getSystemLogs(params?: {
    level?: string;
    service?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) {
    return this.get('/monitoring/logs', { params });
  }

  async getSystemConfig() {
    return this.get('/system/config');
  }

  async updateSystemConfig(config: any) {
    return this.put('/system/config', config);
  }

  async getNotificationTemplates() {
    return this.get('/notifications/templates');
  }

  async updateNotificationTemplate(id: string, template: any) {
    return this.put(`/notifications/templates/${id}`, template);
  }

  async testNotificationTemplate(id: string, testData: any) {
    return this.post(`/notifications/templates/${id}/test`, testData);
  }

  // Dispute Management
  async getDisputes(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    raisedBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get('/disputes', { params });
  }

  async getDisputeById(id: string) {
    return this.get(`/disputes/${id}`);
  }

  async assignDispute(id: string, assigneeId: string) {
    return this.post(`/disputes/${id}/assign`, { assigneeId });
  }

  async investigateDispute(id: string) {
    return this.post(`/disputes/${id}/investigate`);
  }

  async resolveDispute(id: string, resolution: string) {
    return this.post(`/disputes/${id}/resolve`, { resolution });
  }

  async closeDispute(id: string) {
    return this.post(`/disputes/${id}/close`);
  }

  async getDisputeMessages(id: string) {
    return this.get(`/disputes/${id}/messages`);
  }

  async sendDisputeMessage(id: string, message: string) {
    return this.post(`/disputes/${id}/messages`, { message, senderType: 'admin' });
  }

  // Content Moderation
  async getContentForModeration(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    reportCount?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get('/content/moderation', { params });
  }

  async moderateContent(id: string, action: 'approve' | 'reject' | 'flag' | 'remove', reason?: string) {
    return this.post(`/content/${id}/moderate`, { action, reason });
  }

  async getContentModerationHistory(id: string) {
    return this.get(`/content/${id}/moderation-history`);
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getOrderStats() {
    return this.get('/dashboard/order-stats');
  }

  async getDisputeStats() {
    return this.get('/dashboard/dispute-stats');
  }

  async getContentStats() {
    return this.get('/dashboard/content-stats');
  }
}

export const adminApiClient = new AdminApiClient();