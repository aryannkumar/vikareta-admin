import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdRevenueAnalytics } from '../ad-revenue-analytics';
import { AdRevenueAnalytics as AdRevenueAnalyticsType } from '@/types';

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
  Cell: () => <div data-testid="cell" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />
}));

const mockAnalytics: AdRevenueAnalyticsType = {
  totalRevenue: 250000,
  platformRevenue: 180000,
  externalNetworkRevenue: {
    adsense: 50000,
    adstra: 20000
  },
  revenueByPlatform: {
    web: 120000,
    mobile: 80000,
    dashboard: 50000
  },
  revenueGrowth: 15.5,
  topRevenueGenerators: [
    {
      business: {
        id: 'business-1',
        email: 'top@business.com',
        firstName: 'Top',
        lastName: 'Business',
        businessName: 'Top Revenue Business',
        phone: '+1234567890',
        verificationTier: 'premium',
        isVerified: true,
        isActive: true,
        role: 'seller',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      revenue: 45000,
      campaigns: 8
    },
    {
      business: {
        id: 'business-2',
        email: 'second@business.com',
        firstName: 'Second',
        lastName: 'Business',
        businessName: 'Second Revenue Business',
        phone: '+1234567891',
        verificationTier: 'enhanced',
        isVerified: true,
        isActive: true,
        role: 'seller',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      revenue: 32000,
      campaigns: 5
    }
  ],
  monthlyTrends: [
    {
      month: 'Jan 2024',
      revenue: 200000,
      growth: 10.5
    },
    {
      month: 'Feb 2024',
      revenue: 230000,
      growth: 15.0
    },
    {
      month: 'Mar 2024',
      revenue: 250000,
      growth: 8.7
    }
  ]
};

describe('AdRevenueAnalytics', () => {
  it('renders loading state when analytics is null', () => {
    render(<AdRevenueAnalytics analytics={null} />);
    
    // Should show skeleton loading cards
    const skeletonCards = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('animate-pulse')
    );
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('displays revenue overview correctly', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('₹2,50,000')).toBeInTheDocument(); // Total Revenue
    expect(screen.getByText('15.5% vs last month')).toBeInTheDocument(); // Growth
    expect(screen.getByText('₹1,80,000')).toBeInTheDocument(); // Platform Revenue
    expect(screen.getByText('72.0% of total')).toBeInTheDocument(); // Platform percentage
    expect(screen.getByText('₹70,000')).toBeInTheDocument(); // External Networks (50k + 20k)
    expect(screen.getByText('2')).toBeInTheDocument(); // Top Generators count
  });

  it('shows correct growth indicators', () => {
    // Test positive growth
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);
    expect(screen.getByText('+15.5% vs last month')).toBeInTheDocument();

    // Test negative growth
    const negativeGrowthAnalytics = { ...mockAnalytics, revenueGrowth: -5.2 };
    const { rerender } = render(<AdRevenueAnalytics analytics={negativeGrowthAnalytics} />);
    expect(screen.getByText('5.2% vs last month')).toBeInTheDocument();

    // Test zero growth
    const zeroGrowthAnalytics = { ...mockAnalytics, revenueGrowth: 0 };
    rerender(<AdRevenueAnalytics analytics={zeroGrowthAnalytics} />);
    expect(screen.getByText('0.0% vs last month')).toBeInTheDocument();
  });

  it('renders revenue trends chart', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Revenue Trends')).toBeInTheDocument();
    expect(screen.getByText('Monthly revenue performance and growth')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('displays platform revenue distribution', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Platform Revenue Distribution')).toBeInTheDocument();
    expect(screen.getByText('Revenue breakdown by platform')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    
    // Check platform revenue values
    expect(screen.getByText('₹1,20,000')).toBeInTheDocument(); // Web
    expect(screen.getByText('₹80,000')).toBeInTheDocument(); // Mobile
    expect(screen.getByText('₹50,000')).toBeInTheDocument(); // Dashboard
    
    // Check percentages
    expect(screen.getByText('48.0%')).toBeInTheDocument(); // Web percentage (120k/250k)
    expect(screen.getByText('32.0%')).toBeInTheDocument(); // Mobile percentage (80k/250k)
    expect(screen.getByText('20.0%')).toBeInTheDocument(); // Dashboard percentage (50k/250k)
  });

  it('shows external network performance', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('External Network Performance')).toBeInTheDocument();
    expect(screen.getByText('Revenue from external ad networks')).toBeInTheDocument();
    
    // AdSense
    expect(screen.getByText('Google AdSense')).toBeInTheDocument();
    expect(screen.getByText('₹50,000')).toBeInTheDocument(); // AdSense revenue
    expect(screen.getByText('71.4%')).toBeInTheDocument(); // AdSense share (50k/70k)
    
    // Adstra
    expect(screen.getByText('Adstra Network')).toBeInTheDocument();
    expect(screen.getByText('₹20,000')).toBeInTheDocument(); // Adstra revenue
    expect(screen.getByText('28.6%')).toBeInTheDocument(); // Adstra share (20k/70k)
    
    // Total external
    expect(screen.getByText('Total External Revenue')).toBeInTheDocument();
    expect(screen.getByText('28.0% of total revenue')).toBeInTheDocument(); // 70k/250k
  });

  it('displays top revenue generators', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Top Revenue Generators')).toBeInTheDocument();
    expect(screen.getByText('Businesses contributing most to platform revenue')).toBeInTheDocument();
    
    // First business
    expect(screen.getByText('Top Revenue Business')).toBeInTheDocument();
    expect(screen.getByText('top@business.com')).toBeInTheDocument();
    expect(screen.getByText('₹45,000')).toBeInTheDocument(); // Revenue
    expect(screen.getByText('8')).toBeInTheDocument(); // Campaigns
    expect(screen.getByText('18.0%')).toBeInTheDocument(); // Share (45k/250k)
    
    // Second business
    expect(screen.getByText('Second Revenue Business')).toBeInTheDocument();
    expect(screen.getByText('second@business.com')).toBeInTheDocument();
    expect(screen.getByText('₹32,000')).toBeInTheDocument(); // Revenue
    expect(screen.getByText('5')).toBeInTheDocument(); // Campaigns
    expect(screen.getByText('12.8%')).toBeInTheDocument(); // Share (32k/250k)
  });

  it('shows empty state when no revenue generators', () => {
    const analyticsWithoutGenerators = {
      ...mockAnalytics,
      topRevenueGenerators: []
    };

    render(<AdRevenueAnalytics analytics={analyticsWithoutGenerators} />);

    expect(screen.getByText('No Revenue Data')).toBeInTheDocument();
    expect(screen.getByText('Revenue generator data will appear here once campaigns generate revenue.')).toBeInTheDocument();
  });

  it('renders monthly growth analysis chart', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Monthly Growth Analysis')).toBeInTheDocument();
    expect(screen.getByText('Month-over-month revenue growth trends')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('displays revenue performance summary', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Revenue Performance Summary')).toBeInTheDocument();
    expect(screen.getByText('Key revenue metrics and insights')).toBeInTheDocument();
    
    // Check summary values
    expect(screen.getByText('+15.5%')).toBeInTheDocument(); // Revenue Growth
    expect(screen.getByText('72.0%')).toBeInTheDocument(); // Platform Revenue Share
    expect(screen.getByText('2')).toBeInTheDocument(); // Active Revenue Generators
  });

  it('shows correct growth status indicators', () => {
    // Test excellent growth (> 10%)
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);
    expect(screen.getByText('Excellent Growth')).toBeInTheDocument();

    // Test positive growth (0-10%)
    const positiveGrowthAnalytics = { ...mockAnalytics, revenueGrowth: 5.0 };
    const { rerender } = render(<AdRevenueAnalytics analytics={positiveGrowthAnalytics} />);
    expect(screen.getByText('Positive Growth')).toBeInTheDocument();

    // Test needs attention (< 0%)
    const negativeGrowthAnalytics = { ...mockAnalytics, revenueGrowth: -2.0 };
    rerender(<AdRevenueAnalytics analytics={negativeGrowthAnalytics} />);
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });

  it('displays verification tier badges correctly', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('premium')).toBeInTheDocument();
    expect(screen.getByText('enhanced')).toBeInTheDocument();
  });

  it('shows ranking numbers for top generators', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('formats currency correctly throughout', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    // Check various currency formats
    expect(screen.getByText('₹2,50,000')).toBeInTheDocument(); // Total revenue
    expect(screen.getByText('₹1,80,000')).toBeInTheDocument(); // Platform revenue
    expect(screen.getByText('₹50,000')).toBeInTheDocument(); // AdSense revenue
    expect(screen.getByText('₹20,000')).toBeInTheDocument(); // Adstra revenue
    expect(screen.getByText('₹45,000')).toBeInTheDocument(); // Top generator revenue
  });

  it('calculates percentages correctly', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    // Platform revenue share: 180k/250k = 72%
    expect(screen.getByText('72.0% of total')).toBeInTheDocument();
    
    // External network total share: 70k/250k = 28%
    expect(screen.getByText('28.0% of total revenue')).toBeInTheDocument();
    
    // AdSense share of external: 50k/70k = 71.4%
    expect(screen.getByText('71.4%')).toBeInTheDocument();
    
    // Top generator share: 45k/250k = 18%
    expect(screen.getByText('18.0%')).toBeInTheDocument();
  });

  it('shows progress bars for external networks', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays network badges correctly', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    expect(screen.getByText('Primary')).toBeInTheDocument(); // AdSense badge
    expect(screen.getByText('Secondary')).toBeInTheDocument(); // Adstra badge
  });

  it('handles zero revenue gracefully', () => {
    const zeroAnalytics: AdRevenueAnalyticsType = {
      totalRevenue: 0,
      platformRevenue: 0,
      externalNetworkRevenue: {
        adsense: 0,
        adstra: 0
      },
      revenueByPlatform: {
        web: 0,
        mobile: 0,
        dashboard: 0
      },
      revenueGrowth: 0,
      topRevenueGenerators: [],
      monthlyTrends: []
    };

    render(<AdRevenueAnalytics analytics={zeroAnalytics} />);

    expect(screen.getAllByText('₹0')).toHaveLength(8); // All zero revenue values
    expect(screen.getByText('0.0% vs last month')).toBeInTheDocument();
  });

  it('displays chart components correctly', () => {
    render(<AdRevenueAnalytics analytics={mockAnalytics} />);

    // Check for chart elements
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
  });
});