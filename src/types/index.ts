// User Management Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  gstin?: string;
  verificationTier: 'basic' | 'standard' | 'enhanced' | 'premium';
  isVerified: boolean;
  isActive: boolean;
  role: 'buyer' | 'seller' | 'both';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileImage?: string;
  documents?: UserDocument[];
}

export interface UserDocument {
  id: string;
  userId: string;
  documentType: 'pan' | 'aadhaar' | 'gst' | 'business_license' | 'other';
  documentNumber: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
  verifiedAt?: string;
  fileUrl: string;
}

// Product Management Types
export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  price: number;
  currency: string;
  stockQuantity: number;
  minOrderQuantity: number;
  isService: boolean;
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  seller?: User;
  category?: Category;
  media?: ProductMedia[];
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  featured?: boolean;
  sortOrder: number;
  createdAt: string;
  children?: Category[];
  parent?: Category;
}

export interface ProductMedia {
  id: string;
  productId: string;
  mediaType: 'image' | 'video' | 'document';
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
}

// Order Management Types
export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  orderType: 'product' | 'service';
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  buyer?: User;
  seller?: User;
  items?: OrderItem[];
  dispute?: Dispute;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

// Financial Management Types
export interface Transaction {
  id: string;
  userId: string;
  transactionType: 'credit' | 'debit' | 'lock' | 'unlock';
  amount: number;
  balanceAfter: number;
  referenceType: 'order' | 'settlement' | 'withdrawal' | 'refund' | 'commission';
  referenceId: string;
  cashfreeTransactionId?: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  user?: User;
}

export interface Settlement {
  id: string;
  sellerId: string;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settlementDate: string;
  cashfreePayoutId?: string;
  createdAt: string;
  seller?: User;
  orders?: Order[];
}

// Analytics Types
export interface AnalyticsData {
  period: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    platformCommission: number;
    averageOrderValue: number;
  };
  trends: {
    userGrowth: number;
    orderGrowth: number;
    revenueGrowth: number;
  };
  charts: {
    userRegistrations: ChartDataPoint[];
    orderVolume: ChartDataPoint[];
    revenue: ChartDataPoint[];
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DetailedAnalytics extends AnalyticsData {
  breakdown: {
    categories: CategoryPerformance[];
    regions: RegionPerformance[];
    sellers: SellerPerformance[];
    timeOfDay: TimeOfDayData[];
  };
  cohortAnalysis: CohortData[];
  funnelAnalysis: FunnelStage[];
}

export interface CategoryPerformance {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  products: number;
  growth: number;
}

export interface RegionPerformance {
  region: string;
  users: number;
  orders: number;
  revenue: number;
  growth: number;
}

export interface SellerPerformance {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  rating: number;
  growth: number;
}

export interface TimeOfDayData {
  hour: number;
  orders: number;
  revenue: number;
}

export interface CohortData {
  cohort: string;
  period: number;
  users: number;
  retention: number;
}

export interface FunnelStage {
  stage: string;
  users: number;
  conversionRate: number;
}

export interface RealtimeMetrics {
  activeUsers: number;
  ordersToday: number;
  revenueToday: number;
  newRegistrations: number;
  pendingDisputes: number;
  systemHealth: {
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface PerformanceMetrics {
  apiMetrics: {
    averageResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
    slowestEndpoints: EndpointMetric[];
  };
  databaseMetrics: {
    queryTime: number;
    connectionPool: number;
    slowQueries: QueryMetric[];
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
}

export interface EndpointMetric {
  endpoint: string;
  method: string;
  averageTime: number;
  errorRate: number;
  requestCount: number;
}

export interface QueryMetric {
  query: string;
  averageTime: number;
  executionCount: number;
  table: string;
}

export interface BusinessIntelligence {
  marketTrends: MarketTrend[];
  competitorAnalysis: CompetitorData[];
  customerSegments: CustomerSegment[];
  productRecommendations: ProductRecommendation[];
  riskAssessment: RiskFactor[];
}

export interface MarketTrend {
  category: string;
  trend: 'growing' | 'stable' | 'declining';
  growth: number;
  opportunity: string;
}

export interface CompetitorData {
  name: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
}

export interface CustomerSegment {
  segment: string;
  size: number;
  revenue: number;
  characteristics: string[];
  recommendations: string[];
}

export interface ProductRecommendation {
  category: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

export interface RiskFactor {
  factor: string;
  level: 'high' | 'medium' | 'low';
  impact: string;
  mitigation: string;
}

// System Configuration Types
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description: string;
  category: 'general' | 'payment' | 'notification' | 'security' | 'feature';
  isEditable: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'whatsapp';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter and Search Types
export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Advertisement Management Types
export interface AdCampaign {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  campaignType: 'product' | 'service' | 'brand';
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  budget: number;
  dailyBudget?: number;
  spentAmount: number;
  bidAmount: number;
  biddingStrategy: 'cpc' | 'cpm' | 'cpa';
  startDate: string;
  endDate?: string;
  targetingConfig: {
    demographics?: {
      ageRange?: [number, number];
      gender?: 'male' | 'female' | 'all';
      interests?: string[];
    };
    location?: {
      countries?: string[];
      states?: string[];
      cities?: string[];
      radius?: number;
    };
    behavior?: {
      deviceTypes?: string[];
      platforms?: string[];
      timeOfDay?: string[];
      dayOfWeek?: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
  business?: User;
  ads?: Advertisement[];
  analytics?: AdAnalytics[];
  approvals?: AdApproval[];
}

export interface Advertisement {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  adType: 'banner' | 'native' | 'video' | 'carousel';
  adFormat: 'image' | 'video' | 'html';
  content: {
    images?: string[];
    videos?: string[];
    html?: string;
  };
  callToAction: string;
  destinationUrl: string;
  priority: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  campaign?: AdCampaign;
}

export interface AdApproval {
  id: string;
  campaignId: string;
  reviewerId?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  campaign?: AdCampaign;
  reviewer?: User;
}

export interface AdAnalytics {
  id: string;
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  createdAt: string;
  updatedAt: string;
  campaign?: AdCampaign;
}

export interface AdApprovalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageReviewTime: number;
  pendingByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: {
    approved: number;
    rejected: number;
    submitted: number;
  };
}

export interface AdPlatformAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averageCPC: number;
  topPerformingCampaigns: AdCampaign[];
  platformBreakdown: {
    web: { impressions: number; clicks: number; spend: number };
    mobile: { impressions: number; clicks: number; spend: number };
    dashboard: { impressions: number; clicks: number; spend: number };
  };
  timeSeriesData: {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    revenue: number;
  }[];
}

export interface AdRevenueAnalytics {
  totalRevenue: number;
  platformRevenue: number;
  externalNetworkRevenue: {
    adsense: number;
    adstra: number;
  };
  revenueByPlatform: {
    web: number;
    mobile: number;
    dashboard: number;
  };
  revenueGrowth: number;
  topRevenueGenerators: {
    business: User;
    revenue: number;
    campaigns: number;
  }[];
  monthlyTrends: {
    month: string;
    revenue: number;
    growth: number;
  }[];
}

export interface AdSystemHealth {
  adServingPerformance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    requestsPerSecond: number;
  };
  budgetSystemHealth: {
    lockingSuccessRate: number;
    deductionAccuracy: number;
    averageLockTime: number;
  };
  externalNetworkStatus: {
    adsense: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
      errorRate: number;
    };
    adstra: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
      errorRate: number;
    };
  };
  fraudDetectionMetrics: {
    totalChecks: number;
    fraudDetected: number;
    falsePositiveRate: number;
  };
}

export interface AdQualityScore {
  overallScore: number;
  factors: {
    contentQuality: number;
    targetingRelevance: number;
    landingPageQuality: number;
    historicalPerformance: number;
  };
  recommendations: string[];
  issues: {
    severity: 'high' | 'medium' | 'low';
    message: string;
    suggestion: string;
  }[];
}

// Permission Types
export type Permission = 
  | 'users.read' | 'users.write' | 'users.verify' | 'users.suspend'
  | 'products.read' | 'products.write' | 'products.approve' | 'products.reject'
  | 'orders.read' | 'orders.write' | 'orders.cancel' | 'orders.refund'
  | 'finance.read' | 'finance.write' | 'finance.settlements'
  | 'analytics.read' | 'analytics.export'
  | 'system.read' | 'system.write' | 'system.config'
  | 'notifications.read' | 'notifications.write' | 'notifications.send'
  | 'ads.read' | 'ads.write' | 'ads.approve' | 'ads.reject' | 'ads.analytics';