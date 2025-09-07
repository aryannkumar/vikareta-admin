import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, getApiUrl } from '@/config/api';
import { vikaretaSSOClient } from '@/lib/auth/vikareta';

const API_BASE_URL = getApiUrl();
// Same-origin proxies for auth endpoints within the Next.js app
const AUTH_PROXY_BASE = '/api/auth';

class AdminApiClient {
  private client: AxiosInstance;
  private csrfClient: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
  this.client = axios.create({
      baseURL: `${API_BASE_URL}/admin`,
      timeout: API_CONFIG.timeout,
      withCredentials: API_CONFIG.withCredentials,
      headers: API_CONFIG.defaultHeaders,
    });

    // Separate client for CSRF token and auth requests
    this.csrfClient = axios.create({
      // Use same-origin for CSRF to carry cookies reliably
      baseURL: '/',
      timeout: API_CONFIG.timeout,
      withCredentials: API_CONFIG.withCredentials,
      headers: API_CONFIG.defaultHeaders,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and CSRF token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          // Use unified SSO client to obtain an access token (if available)
          const token = vikaretaSSOClient.getAccessToken();
          if (token) {
            config.headers = config.headers || {};
            // headers typings expect AxiosRequestHeaders-like shape
            (config.headers as any).Authorization = `Bearer ${token}`;
          }

          // Add CSRF token for non-GET requests if present (best-effort)
          if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
            const csrfToken = this.csrfToken;
            if (csrfToken) {
              config.headers = config.headers || {};
              config.headers['X-CSRF-Token'] = csrfToken;
            }
          }
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor to handle auth and CSRF errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        const originalRequest = error.config;

        // Handle 403 CSRF token errors
        if (error.response?.status === 403 && !originalRequest._csrfRetry) {
          const errorData = error.response?.data;
          const message = errorData?.error?.message || errorData?.message || '';

          if (message.includes('CSRF') || message.includes('csrf')) {
            console.log('CSRF token expired, clearing and retrying...');
            originalRequest._csrfRetry = true;

            // Clear old token and get fresh one
            this.csrfToken = null;
            await this.ensureCSRFToken();

            if (this.csrfToken) {
              originalRequest.headers['X-CSRF-Token'] = this.csrfToken;
            }

            return this.client(originalRequest);
          }
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt token refresh via unified SSO client
            const refreshed = await vikaretaSSOClient.refreshToken();
            if (refreshed) {
              const newToken = vikaretaSSOClient.getAccessToken();
              if (newToken) {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.client(originalRequest);
              }
            }
          } catch {
            // fallthrough to logout
          }

          // If refresh failed, ensure unified logout flow and redirect
          try { await vikaretaSSOClient.logout(); } catch {}
          if (typeof window !== 'undefined') window.location.href = '/login';
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

    // Use same-origin proxy for auth endpoints to ensure cookies/CSRF
    const authClient = axios.create({
      baseURL: AUTH_PROXY_BASE,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add tokens to auth requests using unified SSO client
    if (typeof window !== 'undefined') {
      const token = vikaretaSSOClient.getAccessToken();
      if (token) {
        authClient.defaults.headers.Authorization = `Bearer ${token}`;
      }

      if (method !== 'get') {
        const csrfToken = this.csrfToken;
        if (csrfToken) {
          authClient.defaults.headers['X-CSRF-Token'] = csrfToken;
          console.log('Adding CSRF token to auth request:', csrfToken.substring(0, 10) + '...');
        } else {
          console.warn('No CSRF token available for auth request');
        }
      }
    }

  console.log('Making auth request via proxy:', method.toUpperCase(), `${AUTH_PROXY_BASE}${url}`);
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
          console.log('Fetching CSRF token from same-origin:', '/csrf-token');
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

              // Keep CSRF token in-memory only (avoid localStorage)
              this.csrfToken = csrfToken;
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
      // First, get a fresh CSRF token
      console.log('Fetching fresh CSRF token for login...');
  const csrfUrl = `/csrf-token`;
  console.log('CSRF URL (same-origin):', csrfUrl);

  const csrfResponse = await axios.get(csrfUrl, {
        withCredentials: true,
        headers: API_CONFIG.defaultHeaders,
      });

      console.log('CSRF response:', csrfResponse.data);

      // Extract CSRF token
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

      // Now make the login request
    const loginUrl = `${AUTH_PROXY_BASE}/login`;
    console.log('Login URL (via proxy):', loginUrl);

    const loginResponse = await axios.post(loginUrl, {
        email,
        password,
      }, {
        withCredentials: true,
        headers: {
          ...API_CONFIG.defaultHeaders,
      // Backend expects X-XSRF-TOKEN when using Laravel-like CSRF cookie pattern
      'X-XSRF-TOKEN': csrfToken,
        },
      });

      console.log('Login response:', loginResponse.data);

  // Store the CSRF token in-memory for future use and initialize unified SSO client
  this.csrfToken = csrfToken;

      try {
        // Let the unified SSO client pick up cookies/state set by backend
        await vikaretaSSOClient.initialize();
      } catch (e) {
        console.warn('SSO client initialization after login failed', e);
      }

      return loginResponse;
    } catch (error: any) {
      console.error('Login with CSRF failed:', error?.message || error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
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

  async getNotificationTemplates(filters?: any) {
    return this.get('/notification-templates', { params: filters });
  }

  async createNotificationTemplate(data: any) {
    return this.post('/notification-templates', data);
  }

  async updateNotificationTemplate(id: string, template: any) {
    return this.put(`/notification-templates/${id}`, template);
  }

  async deleteNotificationTemplate(id: string) {
    return this.delete(`/notification-templates/${id}`);
  }

  async testNotificationTemplate(id: string, testData: any) {
    return this.post(`/notification-templates/${id}/test`, testData);
  }
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

  // ===== ADS MANAGEMENT =====
  async getAds(filters?: any) {
    return this.get('/ads', { params: filters });
  }

  async createAd(data: any) {
    return this.post('/ads', data);
  }

  async updateAd(adId: string, data: any) {
    return this.put(`/ads/${adId}`, data);
  }

  async deleteAd(adId: string) {
    return this.delete(`/ads/${adId}`);
  }

  async getAdsAnalytics(period?: string, limit?: number) {
    return this.get('/ads/analytics', { params: { period, limit } });
  }

  // ===== ANALYTICS =====
  async getAnalyticsRevenue(period?: string) {
    return this.get(`/analytics/revenue`, { params: { period } });
  }

  async getAnalyticsProductsPerformance(limit?: number) {
    return this.get(`/analytics/products/performance`, { params: { limit } });
  }

  async getAnalyticsProducts(query?: any) {
    return this.get(`/analytics/products`, { params: query });
  }

  async getAnalyticsSales(query?: any) {
    return this.get(`/analytics/sales`, { params: query });
  }

  async getAnalyticsOrders(query?: any) {
    return this.get(`/analytics/orders`, { params: query });
  }

  async getAnalyticsRfqs(query?: any) {
    return this.get(`/analytics/rfqs`, { params: query });
  }

  async getAnalyticsWallet(query?: any) {
    return this.get(`/analytics/wallet`, { params: query });
  }

  async getAnalyticsUsers(query?: any) {
    return this.get(`/analytics/users`, { params: query });
  }

  async getAnalyticsCustomers(query?: any) {
    return this.get(`/analytics/customers`, { params: query });
  }

  // ===== ANNOUNCEMENTS =====
  async getAnnouncements(filters?: any) {
    return this.get('/announcements', { params: filters });
  }

  async createAnnouncement(data: any) {
    return this.post('/announcements', data);
  }

  async updateAnnouncement(announcementId: string, data: any) {
    return this.put(`/announcements/${announcementId}`, data);
  }

  async deleteAnnouncement(announcementId: string) {
    return this.delete(`/announcements/${announcementId}`);
  }

  // ===== API KEYS =====
  async getApiKeys() {
    return this.get('/api-keys');
  }

  async createApiKey(data: any) {
    return this.post('/api-keys', data);
  }

  async updateApiKey(keyId: string, data: any) {
    return this.put(`/api-keys/${keyId}`, data);
  }

  async deleteApiKey(keyId: string) {
    return this.delete(`/api-keys/${keyId}`);
  }

  // ===== COUPONS =====
  async getCoupons(filters?: any) {
    return this.get('/coupons', { params: filters });
  }

  async createCoupon(data: any) {
    return this.post('/coupons', data);
  }

  async updateCoupon(couponId: string, data: any) {
    return this.put(`/coupons/${couponId}`, data);
  }

  async deleteCoupon(couponId: string) {
    return this.delete(`/coupons/${couponId}`);
  }

  async validateCoupon(code: string) {
    return this.post('/coupons/validate', { code });
  }

  // ===== DEALS =====
  async getDeals(filters?: any) {
    return this.get('/deals', { params: filters });
  }

  async createDeal(data: any) {
    return this.post('/deals', data);
  }

  async updateDeal(dealId: string, data: any) {
    return this.put(`/deals/${dealId}`, data);
  }

  async deleteDeal(dealId: string) {
    return this.delete(`/deals/${dealId}`);
  }

  // ===== DELIVERY PARTNERS =====
  async getDeliveryPartners(filters?: any) {
    return this.get('/delivery-partners', { params: filters });
  }

  async createDeliveryPartner(data: any) {
    return this.post('/delivery-partners', data);
  }

  async updateDeliveryPartner(partnerId: string, data: any) {
    return this.put(`/delivery-partners/${partnerId}`, data);
  }

  async deleteDeliveryPartner(partnerId: string) {
    return this.delete(`/delivery-partners/${partnerId}`);
  }

  // ===== LOGISTICS PROVIDERS =====
  async getLogisticsProviders(filters?: any) {
    return this.get('/logistics-providers', { params: filters });
  }

  async createLogisticsProvider(data: any) {
    return this.post('/logistics-providers', data);
  }

  async updateLogisticsProvider(providerId: string, data: any) {
    return this.put(`/logistics-providers/${providerId}`, data);
  }

  async deleteLogisticsProvider(providerId: string) {
    return this.delete(`/logistics-providers/${providerId}`);
  }

  // ===== NEGOTIATION BATCHES =====
  async getNegotiationBatches(filters?: any) {
    return this.get('/negotiation-batches', { params: filters });
  }

  async createNegotiationBatch(data: any) {
    return this.post('/negotiation-batches', data);
  }

  async updateNegotiationBatch(batchId: string, data: any) {
    return this.put(`/negotiation-batches/${batchId}`, data);
  }

  async deleteNegotiationBatch(batchId: string) {
    return this.delete(`/negotiation-batches/${batchId}`);
  }

  // ===== NOTIFICATION BATCHES =====
  async getNotificationBatches(filters?: any) {
    return this.get('/notification-batches', { params: filters });
  }

  async createNotificationBatch(data: any) {
    return this.post('/notification-batches', data);
  }

  async updateNotificationBatch(batchId: string, data: any) {
    return this.put(`/notification-batches/${batchId}`, data);
  }

  async deleteNotificationBatch(batchId: string) {
    return this.delete(`/notification-batches/${batchId}`);
  }

  // ===== QUOTES =====
  async getQuotes(filters?: any) {
    return this.get('/quotes', { params: filters });
  }

  async getQuote(quoteId: string) {
    return this.get(`/quotes/${quoteId}`);
  }

  async createQuote(data: any) {
    return this.post('/quotes', data);
  }

  async updateQuote(quoteId: string, data: any) {
    return this.put(`/quotes/${quoteId}`, data);
  }

  async deleteQuote(quoteId: string) {
    return this.delete(`/quotes/${quoteId}`);
  }

  async acceptQuote(quoteId: string) {
    return this.post(`/quotes/${quoteId}/accept`);
  }

  async rejectQuote(quoteId: string, reason?: string) {
    return this.post(`/quotes/${quoteId}/reject`, { reason });
  }

  // ===== REVIEWS =====
  async getReviews(filters?: any) {
    return this.get('/reviews', { params: filters });
  }

  async getReview(reviewId: string) {
    return this.get(`/reviews/${reviewId}`);
  }

  async createReview(data: any) {
    return this.post('/reviews', data);
  }

  async updateReview(reviewId: string, data: any) {
    return this.put(`/reviews/${reviewId}`, data);
  }

  async deleteReview(reviewId: string) {
    return this.delete(`/reviews/${reviewId}`);
  }

  async getProductReviews(productId: string, page?: number, limit?: number) {
    return this.get(`/products/${productId}/reviews`, { params: { page, limit } });
  }

  async getServiceReviews(serviceId: string, page?: number, limit?: number) {
    return this.get(`/services/${serviceId}/reviews`, { params: { page, limit } });
  }

  // ===== SECURITY SETTINGS =====
  async getSecuritySettingsConfig() {
    return this.get('/security-settings');
  }

  async updateSecuritySettingsConfig(settings: any) {
    return this.put('/security-settings', settings);
  }

  // ===== SERVICE APPOINTMENTS =====
  async getServiceAppointments(filters?: any) {
    return this.get('/service-appointments', { params: filters });
  }

  async getServiceAppointment(appointmentId: string) {
    return this.get(`/service-appointments/${appointmentId}`);
  }

  async createServiceAppointment(data: any) {
    return this.post('/service-appointments', data);
  }

  async updateServiceAppointment(appointmentId: string, data: any) {
    return this.put(`/service-appointments/${appointmentId}`, data);
  }

  async deleteServiceAppointment(appointmentId: string) {
    return this.delete(`/service-appointments/${appointmentId}`);
  }

  async confirmServiceAppointment(appointmentId: string) {
    return this.post(`/service-appointments/${appointmentId}/confirm`);
  }

  async cancelServiceAppointment(appointmentId: string, reason?: string) {
    return this.post(`/service-appointments/${appointmentId}/cancel`, { reason });
  }

  // ===== SHIPPING =====
  async getShippingRates(data: any) {
    return this.post('/shipping/rates', data);
  }

  async createShipment(data: any) {
    return this.post('/shipping/shipments', data);
  }

  async getShipment(shipmentId: string) {
    return this.get(`/shipping/shipments/${shipmentId}`);
  }

  async updateShipment(shipmentId: string, data: any) {
    return this.put(`/shipping/shipments/${shipmentId}`, data);
  }

  async getShippingProviders() {
    return this.get('/shipping/providers');
  }

  async trackShipment(trackingNumber: string) {
    return this.get(`/shipping/track/${trackingNumber}`);
  }

  // ===== SUPPORT =====
  async getSupportTickets(filters?: any) {
    return this.get('/support/tickets', { params: filters });
  }

  async getSupportTicket(ticketId: string) {
    return this.get(`/support/tickets/${ticketId}`);
  }

  async createSupportTicket(data: any) {
    return this.post('/support/tickets', data);
  }

  async updateSupportTicket(ticketId: string, data: any) {
    return this.put(`/support/tickets/${ticketId}`, data);
  }

  async closeSupportTicket(ticketId: string) {
    return this.post(`/support/tickets/${ticketId}/close`);
  }

  async addSupportTicketMessage(ticketId: string, message: string, attachments?: File[]) {
    const formData = new FormData();
    formData.append('message', message);
    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }
    return this.post(`/support/tickets/${ticketId}/messages`, formData);
  }

  // ===== UPLOAD =====
  async uploadFile(file: File, category?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    return this.post('/upload', formData);
  }

  async uploadMultipleFiles(files: File[], category?: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (category) formData.append('category', category);
    return this.post('/upload/multiple', formData);
  }

  async deleteUploadedFile(fileId: string) {
    return this.delete(`/upload/${fileId}`);
  }

  async getUploadedFiles(filters?: any) {
    return this.get('/upload', { params: filters });
  }

  // ===== WALLET =====
  async getWalletBalance() {
    return this.get('/wallet/balance');
  }

  async getWalletTransactions(filters?: any) {
    return this.get('/wallet/transactions', { params: filters });
  }

  async addWalletFunds(amount: number, paymentMethod: string) {
    return this.post('/wallet/add-funds', { amount, paymentMethod });
  }

  async withdrawWalletFunds(amount: number, accountDetails: any) {
    return this.post('/wallet/withdraw', { amount, accountDetails });
  }

  async getWalletSettings() {
    return this.get('/wallet/settings');
  }

  async updateWalletSettings(settings: any) {
    return this.put('/wallet/settings', settings);
  }
}

export const adminApiClient = new AdminApiClient();