import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdSystemHealth } from '../ad-system-health';
import { AdSystemHealth as AdSystemHealthType } from '@/types';

const mockHealth: AdSystemHealthType = {
  adServingPerformance: {
    averageResponseTime: 85,
    successRate: 0.995,
    errorRate: 0.005,
    requestsPerSecond: 45.2
  },
  budgetSystemHealth: {
    lockingSuccessRate: 0.998,
    deductionAccuracy: 0.999,
    averageLockTime: 120
  },
  externalNetworkStatus: {
    adsense: {
      status: 'healthy',
      responseTime: 150,
      errorRate: 0.002
    },
    adstra: {
      status: 'degraded',
      responseTime: 350,
      errorRate: 0.015
    }
  },
  fraudDetectionMetrics: {
    totalChecks: 125000,
    fraudDetected: 1250,
    falsePositiveRate: 0.003
  }
};

describe('AdSystemHealth', () => {
  it('renders loading state when health is null', () => {
    render(<AdSystemHealth health={null} />);
    
    // Should show skeleton loading cards
    const skeletonCards = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('animate-pulse')
    );
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('displays system overview correctly', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('99.50%')).toBeInTheDocument(); // Success Rate
    expect(screen.getByText('85ms')).toBeInTheDocument(); // Response Time
    expect(screen.getByText('0.50%')).toBeInTheDocument(); // Error Rate
    expect(screen.getByText('45.2')).toBeInTheDocument(); // Requests/sec
  });

  it('shows correct health status indicators', () => {
    render(<AdSystemHealth health={mockHealth} />);

    // Success rate should be healthy (>99%)
    expect(screen.getByText('healthy')).toBeInTheDocument();
    
    // Response time should be healthy (<100ms)
    expect(screen.getByText('healthy')).toBeInTheDocument();
    
    // Error rate should be healthy (<1%)
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('displays system alerts for poor performance', () => {
    const poorHealth: AdSystemHealthType = {
      ...mockHealth,
      adServingPerformance: {
        averageResponseTime: 250, // High response time
        successRate: 0.94, // Low success rate
        errorRate: 0.06, // High error rate
        requestsPerSecond: 45.2
      }
    };

    render(<AdSystemHealth health={poorHealth} />);

    expect(screen.getByText('System performance is below optimal levels.')).toBeInTheDocument();
    expect(screen.getByText(/Success rate is low/)).toBeInTheDocument();
    expect(screen.getByText(/Response time is high/)).toBeInTheDocument();
    expect(screen.getByText(/Error rate is elevated/)).toBeInTheDocument();
  });

  it('renders ad serving performance section', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('Ad Serving Performance')).toBeInTheDocument();
    expect(screen.getByText('Real-time performance metrics for ad serving system')).toBeInTheDocument();
    
    // Check progress bars and targets
    expect(screen.getByText('Target: ≥99%')).toBeInTheDocument(); // Success rate target
    expect(screen.getByText('Target: ≤100ms')).toBeInTheDocument(); // Response time target
    expect(screen.getByText('Target: ≤1%')).toBeInTheDocument(); // Error rate target
  });

  it('displays budget system health', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('Budget System Health')).toBeInTheDocument();
    expect(screen.getByText('Wallet and budget management system performance')).toBeInTheDocument();
    
    expect(screen.getByText('99.8%')).toBeInTheDocument(); // Locking success rate
    expect(screen.getByText('99.9%')).toBeInTheDocument(); // Deduction accuracy
    expect(screen.getByText('120ms')).toBeInTheDocument(); // Average lock time
  });

  it('shows budget system status indicators', () => {
    render(<AdSystemHealth health={mockHealth} />);

    // Lock time should show "Good" status (100-500ms)
    expect(screen.getByText('Good')).toBeInTheDocument();
    
    // Test excellent lock time (<100ms)
    const excellentHealth = {
      ...mockHealth,
      budgetSystemHealth: {
        ...mockHealth.budgetSystemHealth,
        averageLockTime: 80
      }
    };
    
    const { rerender } = render(<AdSystemHealth health={excellentHealth} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    
    // Test needs attention lock time (>500ms)
    const slowHealth = {
      ...mockHealth,
      budgetSystemHealth: {
        ...mockHealth.budgetSystemHealth,
        averageLockTime: 600
      }
    };
    
    rerender(<AdSystemHealth health={slowHealth} />);
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });

  it('displays external network status', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('External Network Status')).toBeInTheDocument();
    expect(screen.getByText('Health and performance of external ad networks')).toBeInTheDocument();
    
    // AdSense
    expect(screen.getByText('Google AdSense')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument(); // Status badge
    expect(screen.getByText('150ms')).toBeInTheDocument(); // Response time
    expect(screen.getByText('0.20%')).toBeInTheDocument(); // Error rate
    
    // Adstra
    expect(screen.getByText('Adstra Network')).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument(); // Status badge
    expect(screen.getByText('350ms')).toBeInTheDocument(); // Response time
    expect(screen.getByText('1.50%')).toBeInTheDocument(); // Error rate
  });

  it('shows correct status icons for external networks', () => {
    render(<AdSystemHealth health={mockHealth} />);

    // Should have status indicators for healthy and degraded states
    expect(screen.getAllByText('healthy')).toHaveLength(4); // Including system overview
    expect(screen.getAllByText('degraded')).toHaveLength(2); // Status text and badge
  });

  it('displays fraud detection metrics', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('Fraud Detection System')).toBeInTheDocument();
    expect(screen.getByText('Security and fraud prevention system performance')).toBeInTheDocument();
    
    expect(screen.getByText('125,000')).toBeInTheDocument(); // Total checks
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Fraud detected
    expect(screen.getByText('0.30%')).toBeInTheDocument(); // False positive rate
    
    // Check calculated percentages
    expect(screen.getByText('1.00% of total')).toBeInTheDocument(); // Fraud detection rate
    expect(screen.getByText('99.70%')).toBeInTheDocument(); // System accuracy
  });

  it('shows fraud detection summary', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('Fraud Detection Summary')).toBeInTheDocument();
    expect(screen.getByText('Detection Rate:')).toBeInTheDocument();
    expect(screen.getByText('System Accuracy:')).toBeInTheDocument();
    expect(screen.getByText('1.00%')).toBeInTheDocument(); // Detection rate
    expect(screen.getByText('99.70%')).toBeInTheDocument(); // Accuracy
  });

  it('displays overall system health summary', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('System Health Summary')).toBeInTheDocument();
    expect(screen.getByText('Overall system performance and recommendations')).toBeInTheDocument();
    
    expect(screen.getByText('99.5%')).toBeInTheDocument(); // Overall success rate
    expect(screen.getByText('85ms')).toBeInTheDocument(); // Average response time
    expect(screen.getByText('45.2')).toBeInTheDocument(); // Requests per second
  });

  it('shows progress bars for performance metrics', () => {
    render(<AdSystemHealth health={mockHealth} />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles down external network status', () => {
    const downHealth: AdSystemHealthType = {
      ...mockHealth,
      externalNetworkStatus: {
        adsense: {
          status: 'down',
          responseTime: 0,
          errorRate: 1.0
        },
        adstra: {
          status: 'healthy',
          responseTime: 200,
          errorRate: 0.01
        }
      }
    };

    render(<AdSystemHealth health={downHealth} />);

    expect(screen.getByText('Down')).toBeInTheDocument(); // Status badge
    expect(screen.getAllByText('down')).toHaveLength(2); // Status text and badge
  });

  it('calculates health thresholds correctly', () => {
    // Test warning thresholds
    const warningHealth: AdSystemHealthType = {
      ...mockHealth,
      adServingPerformance: {
        averageResponseTime: 150, // Warning threshold
        successRate: 0.97, // Warning threshold
        errorRate: 0.03, // Warning threshold
        requestsPerSecond: 45.2
      }
    };

    render(<AdSystemHealth health={warningHealth} />);

    // Should show warning status
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('formats numbers correctly', () => {
    render(<AdSystemHealth health={mockHealth} />);

    // Check number formatting with commas
    expect(screen.getByText('125,000')).toBeInTheDocument(); // Total checks
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Fraud detected
    
    // Check percentage formatting
    expect(screen.getByText('99.50%')).toBeInTheDocument(); // Success rate
    expect(screen.getByText('0.50%')).toBeInTheDocument(); // Error rate
    expect(screen.getByText('0.30%')).toBeInTheDocument(); // False positive rate
  });

  it('shows appropriate color coding for health status', () => {
    render(<AdSystemHealth health={mockHealth} />);

    // Should have green indicators for healthy metrics
    // Should have appropriate color classes applied
    const healthyElements = screen.getAllByText('healthy');
    expect(healthyElements.length).toBeGreaterThan(0);
  });

  it('displays performance targets correctly', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('Target: ≥99%')).toBeInTheDocument();
    expect(screen.getByText('Target: ≤100ms')).toBeInTheDocument();
    expect(screen.getByText('Target: ≤1%')).toBeInTheDocument();
  });

  it('shows current load level indicator', () => {
    render(<AdSystemHealth health={mockHealth} />);

    expect(screen.getByText('Current load level')).toBeInTheDocument();
    expect(screen.getByText('Current Load')).toBeInTheDocument();
  });
});