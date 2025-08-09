import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdPlatformAnalytics } from '../ad-platform-analytics';
import { AdPlatformAnalytics as AdPlatformAnalyticsType } from '@/types';

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}));

const mockAnalytics: AdPlatformAnalyticsType = {
  totalCampaigns: 150,
  activeCampaigns: 85,
  totalSpend: 125000,
  totalRevenue: 180000,
  totalImpressions: 2500000,
  totalClicks: 75000,
  averageCTR: 3.0,
  averageCPC: 1.67,
  topPerformingCampaigns: [
    {
      id: '1',
      businessId: 'business-1',
      name: 'Top Campaign 1',
      description: 'Best performing campaign',
      campaignType: 'product',
      status: 'active',
      budget: 50000,
      spentAmount: 25000,
      bidAmount: 5.0,
      biddingStrategy: 'cpc',
      startDate: '2024-01-01T00:00:00Z',
      targetingConfig: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      business: {
        id: 'business-1',
        email: 'business@test.com',
        firstName: 'Test',
        lastName: 'Business',
        businessName: 'Top Business',
        phone: '+1234567890',
        verificationTier: 'premium',
        isVerified: true,
        isActive: true,
        role: 'seller',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    }
  ],
  platformBreakdown: {
    web: {
      impressions: 1500000,
      clicks: 45000,
      spend: 75000
    },
    mobile: {
      impressions: 800000,
      clicks: 24000,
      spend: 40000
    },
    dashboard: {
      impressions: 200000,
      clicks: 6000,
      spend: 10000
    }
  },
  timeSeriesData: [
    {
      date: '2024-01-01',
      impressions: 100000,
      clicks: 3000,
      spend: 5000,
      revenue: 7500
    },
    {
      date: '2024-01-02',
      impressions: 120000,
      clicks: 3600,
      spend: 6000,
      revenue: 9000
    }
  ]
};

describe('AdPlatformAnalytics', () => {
  it('renders loading state when analytics is null', () => {
    render(<AdPlatformAnalytics analytics={null} />);
    
    // Should show skeleton loading cards
    const skeletonCards = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('animate-pulse')
    );
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('displays overview stats correctly', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('150')).toBeInTheDocument(); // Total Campaigns
    expect(screen.getByText('85 active')).toBeInTheDocument(); // Active campaigns
    expect(screen.getByText('2,500,000')).toBeInTheDocument(); // Total Impressions
    expect(screen.getByText('75,000')).toBeInTheDocument(); // Total Clicks
    expect(screen.getByText('3.00% CTR')).toBeInTheDocument(); // CTR
    expect(screen.getByText('₹1,25,000')).toBeInTheDocument(); // Total Spend
    expect(screen.getByText('₹1.67 avg CPC')).toBeInTheDocument(); // Average CPC
  });

  it('renders performance trends chart', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    expect(screen.getByText('Daily performance metrics over time')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('displays platform distribution pie chart', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Platform Distribution')).toBeInTheDocument();
    expect(screen.getByText('Impressions by platform')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    
    // Check platform labels
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows platform performance breakdown', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Platform Performance')).toBeInTheDocument();
    expect(screen.getByText('Detailed metrics by platform')).toBeInTheDocument();
    
    // Web platform
    expect(screen.getByText('Web Platform')).toBeInTheDocument();
    expect(screen.getByText('1,500,000')).toBeInTheDocument(); // Web impressions
    expect(screen.getByText('45,000')).toBeInTheDocument(); // Web clicks
    expect(screen.getByText('₹75,000')).toBeInTheDocument(); // Web spend
    
    // Mobile platform
    expect(screen.getByText('Mobile Platform')).toBeInTheDocument();
    expect(screen.getByText('800,000')).toBeInTheDocument(); // Mobile impressions
    expect(screen.getByText('24,000')).toBeInTheDocument(); // Mobile clicks
    expect(screen.getByText('₹40,000')).toBeInTheDocument(); // Mobile spend
    
    // Dashboard platform
    expect(screen.getByText('Dashboard Platform')).toBeInTheDocument();
    expect(screen.getByText('200,000')).toBeInTheDocument(); // Dashboard impressions
    expect(screen.getByText('6,000')).toBeInTheDocument(); // Dashboard clicks
    expect(screen.getByText('₹10,000')).toBeInTheDocument(); // Dashboard spend
  });

  it('displays top performing campaigns', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Top Performing Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Campaigns with highest performance metrics')).toBeInTheDocument();
    
    // Check campaign details
    expect(screen.getByText('Top Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Top Business')).toBeInTheDocument();
    expect(screen.getByText('₹50,000')).toBeInTheDocument(); // Budget
    expect(screen.getByText('₹25,000')).toBeInTheDocument(); // Spent
    expect(screen.getByText('product')).toBeInTheDocument(); // Type
    expect(screen.getByText('active')).toBeInTheDocument(); // Status
  });

  it('shows empty state when no top performing campaigns', () => {
    const analyticsWithoutCampaigns = {
      ...mockAnalytics,
      topPerformingCampaigns: []
    };

    render(<AdPlatformAnalytics analytics={analyticsWithoutCampaigns} />);

    expect(screen.getByText('No Performance Data')).toBeInTheDocument();
    expect(screen.getByText('Campaign performance data will appear here once campaigns are active.')).toBeInTheDocument();
  });

  it('displays key performance indicators', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument();
    expect(screen.getByText('Overall platform health and performance metrics')).toBeInTheDocument();
    
    // Check KPI values
    expect(screen.getByText('3.00%')).toBeInTheDocument(); // Average CTR
    expect(screen.getByText('₹1.67')).toBeInTheDocument(); // Average CPC
    expect(screen.getByText('56.7%')).toBeInTheDocument(); // Campaign Activity Rate (85/150 * 100)
  });

  it('shows correct performance status for CTR', () => {
    // Test excellent CTR (> 2%)
    const excellentCTR = { ...mockAnalytics, averageCTR: 3.0 };
    const { rerender } = render(<AdPlatformAnalytics analytics={excellentCTR} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();

    // Test good CTR (1-2%)
    const goodCTR = { ...mockAnalytics, averageCTR: 1.5 };
    rerender(<AdPlatformAnalytics analytics={goodCTR} />);
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Test needs improvement CTR (< 1%)
    const poorCTR = { ...mockAnalytics, averageCTR: 0.5 };
    rerender(<AdPlatformAnalytics analytics={poorCTR} />);
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
  });

  it('formats numbers and currency correctly', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    // Check number formatting
    expect(screen.getByText('2,500,000')).toBeInTheDocument(); // Impressions with commas
    expect(screen.getByText('75,000')).toBeInTheDocument(); // Clicks with commas
    
    // Check currency formatting
    expect(screen.getByText('₹1,25,000')).toBeInTheDocument(); // Spend with rupee symbol
    expect(screen.getByText('₹1.67')).toBeInTheDocument(); // CPC with rupee symbol
  });

  it('calculates campaign activity rate correctly', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    // Activity rate = (85 active / 150 total) * 100 = 56.7%
    expect(screen.getByText('56.7%')).toBeInTheDocument();
    expect(screen.getByText('Active vs Total Campaigns')).toBeInTheDocument();
  });

  it('displays platform badges correctly', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Primary')).toBeInTheDocument(); // Web platform badge
    expect(screen.getByText('Growing')).toBeInTheDocument(); // Mobile platform badge
    expect(screen.getByText('Business')).toBeInTheDocument(); // Dashboard platform badge
  });

  it('shows progress bars for KPIs', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles zero values gracefully', () => {
    const zeroAnalytics: AdPlatformAnalyticsType = {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalSpend: 0,
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      averageCTR: 0,
      averageCPC: 0,
      topPerformingCampaigns: [],
      platformBreakdown: {
        web: { impressions: 0, clicks: 0, spend: 0 },
        mobile: { impressions: 0, clicks: 0, spend: 0 },
        dashboard: { impressions: 0, clicks: 0, spend: 0 }
      },
      timeSeriesData: []
    };

    render(<AdPlatformAnalytics analytics={zeroAnalytics} />);

    expect(screen.getAllByText('0')).toHaveLength(12); // All zero values
    expect(screen.getByText('₹0')).toBeInTheDocument(); // Zero spend
    expect(screen.getByText('0.00%')).toBeInTheDocument(); // Zero CTR
  });

  it('displays chart components correctly', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    // Check for chart elements
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
  });

  it('shows ranking numbers for top campaigns', () => {
    render(<AdPlatformAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('#1')).toBeInTheDocument(); // Ranking number
  });
});