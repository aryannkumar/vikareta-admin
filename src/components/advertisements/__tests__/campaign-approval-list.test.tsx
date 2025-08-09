import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CampaignApprovalList } from '../campaign-approval-list';
import { useAdminCampaigns } from '@/lib/hooks/use-admin-campaigns';
import { AdCampaign } from '@/types';

// Mock the hook
jest.mock('@/lib/hooks/use-admin-campaigns');
const mockUseAdminCampaigns = useAdminCampaigns as jest.MockedFunction<typeof useAdminCampaigns>;

// Mock the date-fns library
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago')
}));

const mockCampaigns: AdCampaign[] = [
  {
    id: '1',
    businessId: 'business-1',
    name: 'Test Campaign 1',
    description: 'Test campaign description',
    campaignType: 'product',
    status: 'pending_approval',
    budget: 10000,
    dailyBudget: 1000,
    spentAmount: 0,
    bidAmount: 5.0,
    biddingStrategy: 'cpc',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
    targetingConfig: {
      demographics: {
        ageRange: [25, 45],
        interests: ['technology']
      }
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    business: {
      id: 'business-1',
      email: 'business@test.com',
      firstName: 'Test',
      lastName: 'Business',
      businessName: 'Test Business',
      phone: '+1234567890',
      verificationTier: 'standard',
      isVerified: true,
      isActive: true,
      role: 'seller',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    ads: [
      {
        id: 'ad-1',
        campaignId: '1',
        title: 'Test Ad',
        description: 'Test ad description',
        adType: 'banner',
        adFormat: 'image',
        content: { images: ['test-image.jpg'] },
        callToAction: 'Learn More',
        destinationUrl: 'https://example.com',
        priority: 5,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: '2',
    businessId: 'business-2',
    name: 'Test Campaign 2',
    description: 'Another test campaign',
    campaignType: 'service',
    status: 'approved',
    budget: 5000,
    spentAmount: 1000,
    bidAmount: 3.0,
    biddingStrategy: 'cpm',
    startDate: '2024-01-01T00:00:00Z',
    targetingConfig: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    business: {
      id: 'business-2',
      email: 'business2@test.com',
      firstName: 'Test',
      lastName: 'Business 2',
      businessName: 'Test Business 2',
      phone: '+1234567891',
      verificationTier: 'enhanced',
      isVerified: true,
      isActive: true,
      role: 'seller',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    ads: []
  }
];

const mockHookReturn = {
  campaigns: mockCampaigns,
  totalCampaigns: 2,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  approveCampaign: jest.fn(),
  rejectCampaign: jest.fn(),
  bulkApproveCampaigns: jest.fn(),
  bulkRejectCampaigns: jest.fn(),
  getQualityScore: jest.fn(),
  refreshCampaigns: jest.fn()
};

describe('CampaignApprovalList', () => {
  const defaultProps = {
    searchQuery: '',
    statusFilter: 'all',
    campaignTypeFilter: 'all',
    onRefresh: jest.fn()
  };

  beforeEach(() => {
    mockUseAdminCampaigns.mockReturnValue(mockHookReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders campaign list correctly', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    expect(screen.getByText('Campaign Reviews')).toBeInTheDocument();
    expect(screen.getByText('2 campaigns found')).toBeInTheDocument();
    expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
  });

  it('displays campaign details correctly', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    // Check first campaign details
    expect(screen.getByText('Test Business')).toBeInTheDocument();
    expect(screen.getByText('Budget: ₹10,000')).toBeInTheDocument();
    expect(screen.getByText('CPC: ₹5')).toBeInTheDocument();
    
    // Check status badges
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    
    // Check campaign type badges
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseAdminCampaigns.mockReturnValue({
      ...mockHookReturn,
      isLoading: true
    });

    render(<CampaignApprovalList {...defaultProps} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseAdminCampaigns.mockReturnValue({
      ...mockHookReturn,
      isLoading: false,
      error: 'Failed to load campaigns'
    });

    render(<CampaignApprovalList {...defaultProps} />);
    
    expect(screen.getByText('Error Loading Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Failed to load campaigns')).toBeInTheDocument();
  });

  it('shows empty state when no campaigns', () => {
    mockUseAdminCampaigns.mockReturnValue({
      ...mockHookReturn,
      campaigns: []
    });

    render(<CampaignApprovalList {...defaultProps} />);
    
    expect(screen.getByText('No Campaigns Found')).toBeInTheDocument();
    expect(screen.getByText('No campaigns match your current filters.')).toBeInTheDocument();
  });

  it('handles campaign selection', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    
    // Click on first campaign checkbox (index 1, since index 0 is "Select All")
    fireEvent.click(checkboxes[1]);
    
    // Should show bulk action buttons
    expect(screen.getByText('Bulk Approve (1)')).toBeInTheDocument();
    expect(screen.getByText('Bulk Reject (1)')).toBeInTheDocument();
  });

  it('handles select all functionality', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    const selectAllCheckbox = screen.getByLabelText(/Select All/);
    fireEvent.click(selectAllCheckbox);
    
    // Should show bulk action buttons with all campaigns selected
    expect(screen.getByText('Bulk Approve (2)')).toBeInTheDocument();
    expect(screen.getByText('Bulk Reject (2)')).toBeInTheDocument();
  });

  it('opens campaign details modal', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);
    
    expect(screen.getByText('Campaign Details')).toBeInTheDocument();
    expect(screen.getByText('Review campaign information and advertisements')).toBeInTheDocument();
  });

  it('handles single campaign approval', async () => {
    render(<CampaignApprovalList {...defaultProps} />);

    const approveButtons = screen.getAllByText('Approve');
    fireEvent.click(approveButtons[0]);
    
    // Should open approval modal
    expect(screen.getByText('Approve Campaign')).toBeInTheDocument();
    expect(screen.getByText('Approve "Test Campaign 1" for launch')).toBeInTheDocument();
    
    // Click approve button in modal
    const modalApproveButton = screen.getByText('Approve Campaign');
    fireEvent.click(modalApproveButton);
    
    await waitFor(() => {
      expect(mockHookReturn.approveCampaign).toHaveBeenCalledWith('1', '');
    });
  });

  it('handles single campaign rejection', async () => {
    render(<CampaignApprovalList {...defaultProps} />);

    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    
    // Should open rejection modal
    expect(screen.getByText('Reject Campaign')).toBeInTheDocument();
    expect(screen.getByText('Reject "Test Campaign 1" and provide feedback')).toBeInTheDocument();
    
    // Fill in rejection reason
    const reasonTextarea = screen.getByPlaceholderText('Explain why this campaign is being rejected...');
    fireEvent.change(reasonTextarea, { target: { value: 'Content violates policy' } });
    
    // Click reject button in modal
    const modalRejectButton = screen.getByText('Reject Campaign');
    fireEvent.click(modalRejectButton);
    
    await waitFor(() => {
      expect(mockHookReturn.rejectCampaign).toHaveBeenCalledWith('1', 'Content violates policy', '');
    });
  });

  it('handles bulk approval', async () => {
    render(<CampaignApprovalList {...defaultProps} />);

    // Select all campaigns
    const selectAllCheckbox = screen.getByLabelText(/Select All/);
    fireEvent.click(selectAllCheckbox);
    
    // Click bulk approve
    const bulkApproveButton = screen.getByText('Bulk Approve (2)');
    fireEvent.click(bulkApproveButton);
    
    // Should open bulk approval modal
    expect(screen.getByText('Bulk Approve Campaigns')).toBeInTheDocument();
    
    // Click approve in modal
    const modalApproveButton = screen.getByText('Approve 2 Campaigns');
    fireEvent.click(modalApproveButton);
    
    await waitFor(() => {
      expect(mockHookReturn.bulkApproveCampaigns).toHaveBeenCalledWith(['1', '2'], '');
    });
  });

  it('handles bulk rejection', async () => {
    render(<CampaignApprovalList {...defaultProps} />);

    // Select all campaigns
    const selectAllCheckbox = screen.getByLabelText(/Select All/);
    fireEvent.click(selectAllCheckbox);
    
    // Click bulk reject
    const bulkRejectButton = screen.getByText('Bulk Reject (2)');
    fireEvent.click(bulkRejectButton);
    
    // Should open bulk rejection modal
    expect(screen.getByText('Bulk Reject Campaigns')).toBeInTheDocument();
    
    // Fill in rejection reason
    const reasonTextarea = screen.getByPlaceholderText('Explain why these campaigns are being rejected...');
    fireEvent.change(reasonTextarea, { target: { value: 'Bulk policy violation' } });
    
    // Click reject in modal
    const modalRejectButton = screen.getByText('Reject 2 Campaigns');
    fireEvent.click(modalRejectButton);
    
    await waitFor(() => {
      expect(mockHookReturn.bulkRejectCampaigns).toHaveBeenCalledWith(['1', '2'], 'Bulk policy violation', '');
    });
  });

  it('disables reject button without reason', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    
    // Reject button should be disabled without reason
    const modalRejectButton = screen.getByText('Reject Campaign');
    expect(modalRejectButton).toBeDisabled();
    
    // Fill in reason
    const reasonTextarea = screen.getByPlaceholderText('Explain why this campaign is being rejected...');
    fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });
    
    // Button should now be enabled
    expect(modalRejectButton).not.toBeDisabled();
  });

  it('opens preview link in new tab', () => {
    // Mock window.open
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true
    });

    render(<CampaignApprovalList {...defaultProps} />);

    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);
    
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank');
  });

  it('calls onRefresh when refresh button is clicked', () => {
    mockUseAdminCampaigns.mockReturnValue({
      ...mockHookReturn,
      error: 'Test error'
    });

    render(<CampaignApprovalList {...defaultProps} />);

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);
    
    expect(mockHookReturn.refreshCampaigns).toHaveBeenCalled();
  });

  it('shows only approve/reject buttons for pending campaigns', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    // First campaign (pending) should have approve/reject buttons
    const campaignCards = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('border rounded-lg p-4')
    );
    
    // Check that pending campaign has action buttons
    expect(screen.getAllByText('Approve')).toHaveLength(1);
    expect(screen.getAllByText('Reject')).toHaveLength(1);
  });

  it('formats currency and numbers correctly', () => {
    render(<CampaignApprovalList {...defaultProps} />);

    expect(screen.getByText('Budget: ₹10,000')).toBeInTheDocument();
    expect(screen.getByText('Budget: ₹5,000')).toBeInTheDocument();
    expect(screen.getByText('CPC: ₹5')).toBeInTheDocument();
    expect(screen.getByText('CPM: ₹3')).toBeInTheDocument();
  });
});