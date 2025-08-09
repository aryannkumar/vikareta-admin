'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdApprovalStats, AdPlatformAnalytics, AdRevenueAnalytics, AdSystemHealth } from '@/types';
import { adminAdvertisementApi } from '@/lib/api/admin-advertisements';

interface UseAdminAdvertisementsReturn {
  approvalStats: AdApprovalStats | null;
  platformAnalytics: AdPlatformAnalytics | null;
  revenueAnalytics: AdRevenueAnalytics | null;
  systemHealth: AdSystemHealth | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useAdminAdvertisements(): UseAdminAdvertisementsReturn {
  const [approvalStats, setApprovalStats] = useState<AdApprovalStats | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<AdPlatformAnalytics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<AdRevenueAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<AdSystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        approvalStatsResponse,
        platformAnalyticsResponse,
        revenueAnalyticsResponse,
        systemHealthResponse
      ] = await Promise.allSettled([
        adminAdvertisementApi.getApprovalStats(),
        adminAdvertisementApi.getPlatformAnalytics(),
        adminAdvertisementApi.getRevenueAnalytics(),
        adminAdvertisementApi.getSystemHealth()
      ]);

      // Handle approval stats
      if (approvalStatsResponse.status === 'fulfilled') {
        setApprovalStats(approvalStatsResponse.value);
      } else {
        console.error('Failed to fetch approval stats:', approvalStatsResponse.reason);
      }

      // Handle platform analytics
      if (platformAnalyticsResponse.status === 'fulfilled') {
        setPlatformAnalytics(platformAnalyticsResponse.value);
      } else {
        console.error('Failed to fetch platform analytics:', platformAnalyticsResponse.reason);
      }

      // Handle revenue analytics
      if (revenueAnalyticsResponse.status === 'fulfilled') {
        setRevenueAnalytics(revenueAnalyticsResponse.value);
      } else {
        console.error('Failed to fetch revenue analytics:', revenueAnalyticsResponse.reason);
      }

      // Handle system health
      if (systemHealthResponse.status === 'fulfilled') {
        setSystemHealth(systemHealthResponse.value);
      } else {
        console.error('Failed to fetch system health:', systemHealthResponse.reason);
      }

      // Check if all requests failed
      const allFailed = [
        approvalStatsResponse,
        platformAnalyticsResponse,
        revenueAnalyticsResponse,
        systemHealthResponse
      ].every(response => response.status === 'rejected');

      if (allFailed) {
        setError('Failed to load advertisement data. Please try again.');
      }

    } catch (error) {
      console.error('Error fetching admin advertisement data:', error);
      setError('An unexpected error occurred while loading data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    approvalStats,
    platformAnalytics,
    revenueAnalytics,
    systemHealth,
    isLoading,
    error,
    refreshData
  };
}