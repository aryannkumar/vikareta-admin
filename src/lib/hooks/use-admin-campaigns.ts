'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdCampaign, AdQualityScore, PaginatedResponse } from '@/types';
import { adminAdvertisementApi } from '@/lib/api/admin-advertisements';

interface UseAdminCampaignsOptions {
  search?: string;
  status?: string;
  campaignType?: string;
  page?: number;
  limit?: number;
}

interface UseAdminCampaignsReturn {
  campaigns: AdCampaign[];
  totalCampaigns: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  approveCampaign: (campaignId: string, notes?: string) => Promise<void>;
  rejectCampaign: (campaignId: string, reason: string, notes?: string) => Promise<void>;
  bulkApproveCampaigns: (campaignIds: string[], notes?: string) => Promise<void>;
  bulkRejectCampaigns: (campaignIds: string[], reason: string, notes?: string) => Promise<void>;
  getQualityScore: (campaignId: string) => Promise<AdQualityScore | null>;
  refreshCampaigns: () => Promise<void>;
}

export function useAdminCampaigns(options: UseAdminCampaignsOptions = {}): UseAdminCampaignsReturn {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminAdvertisementApi.getPendingApprovals({
        search: options.search,
        status: options.status,
        campaignType: options.campaignType,
        page: options.page || 1,
        limit: options.limit || 20
      });

      setCampaigns(response.data);
      setTotalCampaigns(response.pagination.total);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);

    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
      setTotalCampaigns(0);
    } finally {
      setIsLoading(false);
    }
  }, [options.search, options.status, options.campaignType, options.page, options.limit]);

  const approveCampaign = useCallback(async (campaignId: string, notes?: string) => {
    try {
      await adminAdvertisementApi.approveCampaign(campaignId, notes);

      // Update the campaign in the local state
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'active' as const }
          : campaign
      ));

    } catch (error) {
      console.error('Error approving campaign:', error);
      throw new Error('Failed to approve campaign. Please try again.');
    }
  }, []);

  const rejectCampaign = useCallback(async (campaignId: string, reason: string, notes?: string) => {
    try {
      await adminAdvertisementApi.rejectCampaign(campaignId, reason, notes);

      // Update the campaign in the local state
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'rejected' as const }
          : campaign
      ));

    } catch (error) {
      console.error('Error rejecting campaign:', error);
      throw new Error('Failed to reject campaign. Please try again.');
    }
  }, []);

  const bulkApproveCampaigns = useCallback(async (campaignIds: string[], notes?: string) => {
    try {
      await adminAdvertisementApi.bulkApproveCampaigns(campaignIds, notes);

      // Update the campaigns in the local state
      setCampaigns(prev => prev.map(campaign =>
        campaignIds.includes(campaign.id)
          ? { ...campaign, status: 'active' as const }
          : campaign
      ));

    } catch (error) {
      console.error('Error bulk approving campaigns:', error);
      throw new Error('Failed to approve campaigns. Please try again.');
    }
  }, []);

  const bulkRejectCampaigns = useCallback(async (campaignIds: string[], reason: string, notes?: string) => {
    try {
      await adminAdvertisementApi.bulkRejectCampaigns(campaignIds, reason, notes);

      // Update the campaigns in the local state
      setCampaigns(prev => prev.map(campaign =>
        campaignIds.includes(campaign.id)
          ? { ...campaign, status: 'rejected' as const }
          : campaign
      ));

    } catch (error) {
      console.error('Error bulk rejecting campaigns:', error);
      throw new Error('Failed to reject campaigns. Please try again.');
    }
  }, []);

  const getQualityScore = useCallback(async (campaignId: string): Promise<AdQualityScore | null> => {
    try {
      return await adminAdvertisementApi.getQualityScore(campaignId);
    } catch (error) {
      console.error('Error fetching quality score:', error);
      return null;
    }
  }, []);

  const refreshCampaigns = useCallback(async () => {
    await fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    totalCampaigns,
    currentPage,
    totalPages,
    isLoading,
    error,
    approveCampaign,
    rejectCampaign,
    bulkApproveCampaigns,
    bulkRejectCampaigns,
    getQualityScore,
    refreshCampaigns
  };
}