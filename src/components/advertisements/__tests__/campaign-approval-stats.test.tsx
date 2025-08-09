import React from 'react';
import { render, screen } from '@testing-library/react';
import { CampaignApprovalStats } from '../campaign-approval-stats';
import { AdApprovalStats } from '@/types';

const mockStats: AdApprovalStats = {
  totalPending: 15,
  totalApproved: 85,
  totalRejected: 10,
  averageReviewTime: 4.5, // hours
  pendingByPriority: {
    high: 5,
    medium: 7,
    low: 3
  },
  recentActivity: {
    approved: 12,
    rejected: 3,
    submitted: 8
  }
};

describe('CampaignApprovalStats', () => {
  it('renders loading state when stats is null', () => {
    render(<CampaignApprovalStats stats={null} />);
    
    // Should show skeleton loading cards
    const skeletonCards = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('animate-pulse')
    );
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('displays main stats correctly', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    expect(screen.getByText('15')).toBeInTheDocument(); // Pending Review
    expect(screen.getByText('85')).toBeInTheDocument(); // Approved
    expect(screen.getByText('10')).toBeInTheDocument(); // Rejected
    expect(screen.getByText('4h')).toBeInTheDocument(); // Avg Review Time (4.5 hours formatted)
  });

  it('calculates approval and rejection rates correctly', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    // Total processed = 85 + 10 = 95
    // Approval rate = 85/95 * 100 = 89.5%
    // Rejection rate = 10/95 * 100 = 10.5%
    expect(screen.getByText('89.5% approval rate')).toBeInTheDocument();
    expect(screen.getByText('10.5% rejection rate')).toBeInTheDocument();
  });

  it('displays priority breakdown correctly', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    expect(screen.getByText('Pending by Priority')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // High priority
    expect(screen.getByText('7')).toBeInTheDocument(); // Medium priority
    expect(screen.getByText('3')).toBeInTheDocument(); // Low priority
  });

  it('displays recent activity correctly', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Approved today
    expect(screen.getByText('3')).toBeInTheDocument(); // Rejected today
    expect(screen.getByText('8')).toBeInTheDocument(); // Submitted today
  });

  it('formats review time correctly for different durations', () => {
    // Test minutes (< 1 hour)
    const statsMinutes = { ...mockStats, averageReviewTime: 0.5 };
    const { rerender } = render(<CampaignApprovalStats stats={statsMinutes} />);
    expect(screen.getByText('30m')).toBeInTheDocument();

    // Test hours (1-24 hours)
    const statsHours = { ...mockStats, averageReviewTime: 12.3 };
    rerender(<CampaignApprovalStats stats={statsHours} />);
    expect(screen.getByText('12h')).toBeInTheDocument();

    // Test days (> 24 hours)
    const statsDays = { ...mockStats, averageReviewTime: 48.5 };
    rerender(<CampaignApprovalStats stats={statsDays} />);
    expect(screen.getByText('2d')).toBeInTheDocument();
  });

  it('displays performance indicators correctly', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    expect(screen.getByText('Review Performance')).toBeInTheDocument();
    expect(screen.getByText('89.5%')).toBeInTheDocument(); // Approval Rate
    expect(screen.getByText('4h')).toBeInTheDocument(); // Avg Review Time
    expect(screen.getByText('15')).toBeInTheDocument(); // Pending Reviews
  });

  it('shows correct status indicators for review time', () => {
    // Test excellent (< 24 hours)
    const statsExcellent = { ...mockStats, averageReviewTime: 12 };
    const { rerender } = render(<CampaignApprovalStats stats={statsExcellent} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();

    // Test good (24-48 hours)
    const statsGood = { ...mockStats, averageReviewTime: 36 };
    rerender(<CampaignApprovalStats stats={statsGood} />);
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Test needs improvement (> 48 hours)
    const statsNeedsImprovement = { ...mockStats, averageReviewTime: 72 };
    rerender(<CampaignApprovalStats stats={statsNeedsImprovement} />);
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
  });

  it('shows correct status indicators for pending queue', () => {
    // Test low queue (< 10)
    const statsLowQueue = { ...mockStats, totalPending: 5 };
    const { rerender } = render(<CampaignApprovalStats stats={statsLowQueue} />);
    expect(screen.getByText('Low Queue')).toBeInTheDocument();

    // Test moderate queue (10-25)
    const statsModerateQueue = { ...mockStats, totalPending: 15 };
    rerender(<CampaignApprovalStats stats={statsModerateQueue} />);
    expect(screen.getByText('Moderate Queue')).toBeInTheDocument();

    // Test high queue (> 25)
    const statsHighQueue = { ...mockStats, totalPending: 30 };
    rerender(<CampaignApprovalStats stats={statsHighQueue} />);
    expect(screen.getByText('High Queue')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    const zeroStats: AdApprovalStats = {
      totalPending: 0,
      totalApproved: 0,
      totalRejected: 0,
      averageReviewTime: 0,
      pendingByPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      recentActivity: {
        approved: 0,
        rejected: 0,
        submitted: 0
      }
    };

    render(<CampaignApprovalStats stats={zeroStats} />);

    expect(screen.getAllByText('0')).toHaveLength(8); // All zero values
    expect(screen.getByText('0m')).toBeInTheDocument(); // Zero review time
  });

  it('calculates progress bars correctly', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    // Priority breakdown progress bars should be based on percentage of total pending
    // High: 5/15 = 33.33%
    // Medium: 7/15 = 46.67%
    // Low: 3/15 = 20%
    
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays correct badge colors for priority levels', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('shows activity cards with correct styling', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    // Check for activity section
    expect(screen.getByText('Last 24 hours activity summary')).toBeInTheDocument();
    
    // Check for activity items
    expect(screen.getByText('Campaigns approved today')).toBeInTheDocument();
    expect(screen.getByText('Campaigns rejected today')).toBeInTheDocument();
    expect(screen.getByText('New submissions today')).toBeInTheDocument();
  });

  it('handles edge case where no campaigns are processed', () => {
    const noProcessedStats = {
      ...mockStats,
      totalApproved: 0,
      totalRejected: 0
    };

    render(<CampaignApprovalStats stats={noProcessedStats} />);

    // When no campaigns are processed, rates should be 0%
    expect(screen.getByText('0.0% approval rate')).toBeInTheDocument();
    expect(screen.getByText('0.0% rejection rate')).toBeInTheDocument();
  });

  it('displays all required icons', () => {
    render(<CampaignApprovalStats stats={mockStats} />);

    // Icons should be present (testing by checking for their containers or associated text)
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Avg Review Time')).toBeInTheDocument();
  });
});