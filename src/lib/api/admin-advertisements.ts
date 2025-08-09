import { 
  AdApprovalStats, 
  AdPlatformAnalytics, 
  AdRevenueAnalytics, 
  AdSystemHealth,
  AdCampaign,
  AdQualityScore,
  PaginatedResponse,
  ApiResponse
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class AdminAdvertisementApi {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data.data!;
  }

  // Approval Stats
  async getApprovalStats(dateRange?: { startDate?: string; endDate?: string }): Promise<AdApprovalStats> {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    return this.request<AdApprovalStats>(
      `/api/ads/admin/approvals/stats${queryString ? `?${queryString}` : ''}`
    );
  }

  // Platform Analytics
  async getPlatformAnalytics(options?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
    platform?: 'web' | 'mobile' | 'dashboard';
    businessId?: string;
  }): Promise<AdPlatformAnalytics> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.granularity) params.append('granularity', options.granularity);
    if (options?.platform) params.append('platform', options.platform);
    if (options?.businessId) params.append('businessId', options.businessId);
    
    const queryString = params.toString();
    return this.request<AdPlatformAnalytics>(
      `/api/ads/admin/analytics/platform${queryString ? `?${queryString}` : ''}`
    );
  }

  // Revenue Analytics
  async getRevenueAnalytics(options?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'day' | 'week' | 'month';
  }): Promise<AdRevenueAnalytics> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.granularity) params.append('granularity', options.granularity);
    
    const queryString = params.toString();
    return this.request<AdRevenueAnalytics>(
      `/api/ads/admin/analytics/revenue${queryString ? `?${queryString}` : ''}`
    );
  }

  // External Network Analytics
  async getExternalNetworkAnalytics(options?: {
    startDate?: string;
    endDate?: string;
    network?: 'adsense' | 'adstra';
  }) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.network) params.append('network', options.network);
    
    const queryString = params.toString();
    return this.request(
      `/api/ads/admin/analytics/external-networks${queryString ? `?${queryString}` : ''}`
    );
  }

  // System Health
  async getSystemHealth(): Promise<AdSystemHealth> {
    return this.request<AdSystemHealth>('/api/ads/admin/analytics/system-health');
  }

  // Top Performers
  async getTopPerformers(options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    type?: 'campaigns' | 'businesses' | 'ads';
  }) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.type) params.append('type', options.type);
    
    const queryString = params.toString();
    return this.request(
      `/api/ads/admin/analytics/top-performers${queryString ? `?${queryString}` : ''}`
    );
  }

  // Fraud Detection Analytics
  async getFraudDetectionAnalytics(options?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'hour' | 'day' | 'week';
  }) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.granularity) params.append('granularity', options.granularity);
    
    const queryString = params.toString();
    return this.request(
      `/api/ads/admin/analytics/fraud-detection${queryString ? `?${queryString}` : ''}`
    );
  }

  // Dashboard Overview
  async getDashboardOverview(): Promise<{
    approvalStats: AdApprovalStats;
    platformAnalytics: AdPlatformAnalytics;
    revenueAnalytics: AdRevenueAnalytics;
    systemHealth: AdSystemHealth;
  }> {
    return this.request('/api/ads/admin/analytics/dashboard');
  }

  // Campaign Management
  async getPendingApprovals(options?: {
    search?: string;
    status?: string;
    campaignType?: string;
    businessId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<AdCampaign>> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.campaignType) params.append('campaignType', options.campaignType);
    if (options?.businessId) params.append('businessId', options.businessId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
    
    const queryString = params.toString();
    return this.request<PaginatedResponse<AdCampaign>>(
      `/api/ads/admin/approvals/pending${queryString ? `?${queryString}` : ''}`
    );
  }

  async getCampaignDetails(campaignId: string): Promise<AdCampaign> {
    return this.request<AdCampaign>(`/api/ads/admin/campaigns/${campaignId}`);
  }

  async approveCampaign(campaignId: string, reviewNotes?: string): Promise<void> {
    await this.request(`/api/ads/admin/campaigns/${campaignId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  }

  async rejectCampaign(campaignId: string, rejectionReason: string, reviewNotes?: string): Promise<void> {
    await this.request(`/api/ads/admin/campaigns/${campaignId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason, reviewNotes }),
    });
  }

  async bulkApproveCampaigns(campaignIds: string[], reviewNotes?: string): Promise<void> {
    await this.request('/api/ads/admin/campaigns/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ campaignIds, reviewNotes }),
    });
  }

  async bulkRejectCampaigns(campaignIds: string[], rejectionReason: string, reviewNotes?: string): Promise<void> {
    await this.request('/api/ads/admin/campaigns/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ campaignIds, rejectionReason, reviewNotes }),
    });
  }

  async getQualityScore(campaignId: string): Promise<AdQualityScore> {
    return this.request<AdQualityScore>(`/api/ads/admin/campaigns/${campaignId}/quality-score`);
  }

  // Campaign History and Audit
  async getApprovalHistory(campaignId: string) {
    return this.request(`/api/ads/admin/campaigns/${campaignId}/approval-history`);
  }

  async getApprovalAuditLog(options?: {
    startDate?: string;
    endDate?: string;
    reviewerId?: string;
    action?: 'approved' | 'rejected';
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.reviewerId) params.append('reviewerId', options.reviewerId);
    if (options?.action) params.append('action', options.action);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const queryString = params.toString();
    return this.request(
      `/api/ads/admin/approvals/audit-log${queryString ? `?${queryString}` : ''}`
    );
  }

  // Business Management
  async getBusinessCampaigns(businessId: string, options?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AdCampaign>> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const queryString = params.toString();
    return this.request<PaginatedResponse<AdCampaign>>(
      `/api/ads/admin/businesses/${businessId}/campaigns${queryString ? `?${queryString}` : ''}`
    );
  }

  async suspendBusinessAds(businessId: string, reason: string): Promise<void> {
    await this.request(`/api/ads/admin/businesses/${businessId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reinstateBusinessAds(businessId: string): Promise<void> {
    await this.request(`/api/ads/admin/businesses/${businessId}/reinstate`, {
      method: 'POST',
    });
  }

  // Configuration Management
  async getAdPlacements() {
    return this.request('/api/ads/admin/placements');
  }

  async updateAdPlacement(placementId: string, updates: any) {
    return this.request(`/api/ads/admin/placements/${placementId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getExternalNetworkConfig() {
    return this.request('/api/ads/admin/external-networks');
  }

  async updateExternalNetworkConfig(networkId: string, config: any) {
    return this.request(`/api/ads/admin/external-networks/${networkId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Reports and Exports
  async exportCampaignData(options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    format?: 'csv' | 'xlsx';
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.status) params.append('status', options.status);
    if (options?.format) params.append('format', options.format);
    
    const queryString = params.toString();
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(
      `${API_BASE_URL}/api/ads/admin/reports/campaigns/export${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export campaign data');
    }

    return response.blob();
  }

  async exportAnalyticsData(options?: {
    startDate?: string;
    endDate?: string;
    type?: 'platform' | 'revenue' | 'fraud';
    format?: 'csv' | 'xlsx';
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.type) params.append('type', options.type);
    if (options?.format) params.append('format', options.format);
    
    const queryString = params.toString();
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(
      `${API_BASE_URL}/api/ads/admin/reports/analytics/export${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export analytics data');
    }

    return response.blob();
  }
}

export const adminAdvertisementApi = new AdminAdvertisementApi();