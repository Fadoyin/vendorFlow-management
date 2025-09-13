// User and Authentication Types
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  companyName?: string
  status?: string
  phone?: string
  department?: string
  jobTitle?: string
  permissions?: UserPermission[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  SUPPLIER = 'supplier',
}

export enum UserPermission {
  READ_VENDORS = 'read:vendors',
  WRITE_VENDORS = 'write:vendors',
  READ_INVENTORY = 'read:inventory',
  WRITE_INVENTORY = 'write:inventory',
  READ_PURCHASE_ORDERS = 'read:purchase_orders',
  WRITE_PURCHASE_ORDERS = 'write:purchase_orders',
  APPROVE_PURCHASE_ORDERS = 'approve:purchase_orders',
  READ_FORECASTS = 'read:forecasts',
  WRITE_FORECASTS = 'write:forecasts',
  MANAGE_USERS = 'manage:users',
  MANAGE_TENANT = 'manage:tenant',
}

// Vendor Types
export interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: Address
  category: VendorCategory
  status: VendorStatus
  rating: number
  totalOrders: number
  totalRevenue: number
  createdAt: string
  updatedAt: string
}

export enum VendorCategory {
  FOOD_SUPPLIES = 'food_supplies',
  OFFICE_SUPPLIES = 'office_supplies',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  CLOTHING = 'clothing',
  OTHER = 'other',
}

export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

// Supplier Types
export interface Supplier {
  id: string
  name: string
  code: string
  category: SupplierCategory
  status: SupplierStatus
  contactPerson: string
  email: string
  phone: string
  address: Address
  rating: number
  totalOrders: number
  totalSpent: number
  createdAt: string
  updatedAt: string
}

export enum SupplierCategory {
  FOOD_SUPPLIES = 'food_supplies',
  OFFICE_SUPPLIES = 'office_supplies',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  CLOTHING = 'clothing',
  OTHER = 'other',
}

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

// Order Types
export interface Order {
  id: string
  orderId: string
  vendorId: string
  supplierId: string
  items: OrderItem[]
  status: OrderStatus
  totalAmount: number
  subtotal: number
  tax: number
  shipping: number
  orderDate: string
  expectedDelivery: string
  actualDelivery?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export enum OrderStatus {
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  DISPATCHED = 'dispatched',
  ENROUTE = 'enroute',
  ARRIVED = 'arrived',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// Payment Types
export interface Subscription {
  id: string
  vendorId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripeCustomerId: string
  stripeSubscriptionId?: string
  monthlyPrice: number
  currency: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  nextBillingDate?: string
  totalBilled: number
  totalPaid: number
  outstandingAmount: number
  features: string[]
  createdAt: string
  updatedAt: string
}

export enum SubscriptionPlan {
  FREE_TRIAL = 'free_trial',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
}

export interface PaymentTransaction {
  id: string
  vendorId: string
  subscriptionId?: string
  transactionId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  description?: string
  receiptUrl?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CASH = 'cash',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

// Forecasting Types
export interface Forecast {
  id: string
  vendorId: string
  type: ForecastType
  status: ForecastStatus
  forecastModel: ForecastModel
  forecastPeriod: number
  startDate: string
  endDate: string
  confidenceLevel: number
  inputData: ForecastInputData
  forecastResults?: ForecastResults
  costForecast?: CostForecast
  inventoryForecast?: InventoryForecast
  metadata: ForecastMetadata
  notes?: string
  createdAt: string
  updatedAt: string
}

export enum ForecastType {
  COST = 'cost',
  INVENTORY = 'inventory',
  DEMAND = 'demand',
  REVENUE = 'revenue',
}

export enum ForecastStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum ForecastModel {
  PROPHET = 'prophet',
  XGBOOST = 'xgboost',
  LINEAR_REGRESSION = 'linear_regression',
  ARIMA = 'arima',
  LSTM = 'lstm',
}

export interface ForecastInputData {
  historicalData: any[]
  parameters: Record<string, any>
  filters: Record<string, any>
}

export interface ForecastResults {
  predictions: any[]
  metrics: ForecastMetrics
  confidenceIntervals: any[]
  seasonality: any
  trends: any
}

// Enhanced Forecasting Types
export interface CostForecastInput {
  forecastMonths: number;
  modelType: 'linear' | 'polynomial' | 'exponential' | 'seasonal' | 'hybrid';
  baseMonthlyBudget: number;
  vendorId?: string;
  includeSeasonalFactors?: boolean;
  riskLevel?: number;
  categoryFilters?: string[];
}

export interface CostForecastResult {
  monthlyPredictions: Array<{
    month: string;
    totalCost: number;
    confidence: number;
    growthRate: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    currentCost: number;
    predictedCost: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  overallGrowthRate: number;
  seasonalFactors: Array<{
    period: string;
    factor: number;
    description: string;
  }>;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
    recommendations: string[];
  };
  summary: {
    totalForecastValue: number;
    averageMonthlyCost: number;
    peakMonth: string;
    lowestMonth: string;
    confidenceScore: number;
  };
}

export interface InventoryForecastInput {
  inventoryItems: Array<{
    itemId: string;
    currentStock: number;
    reorderLevel: number;
    leadTime: number;
    category: string;
    supplierInfo?: {
      supplierId: string;
      supplierName: string;
      reliability: number;
      averageDeliveryTime: number;
    };
    unitCost?: number;
    minOrderQuantity?: number;
  }>;
  forecastPeriod: number;
  vendorId?: string;
  includeSeasonality?: boolean;
  safetyStockMultiplier?: number;
  categoryFilters?: string[];
}

export interface InventoryForecastResult {
  itemForecasts: Array<{
    itemId: string;
    itemName: string;
    category: string;
    currentStock: number;
    predictedDemand: Array<{
      date: string;
      demand: number;
      confidence: number;
    }>;
    daysUntilStockout: number;
    reorderRecommendation: {
      shouldReorder: boolean;
      recommendedQuantity: number;
      recommendedDate: string;
      urgency: 'low' | 'medium' | 'high' | 'critical';
    };
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    dailyConsumptionRate: {
      average: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      volatility: number;
    };
  }>;
  summary: {
    totalItems: number;
    itemsRequiringReorder: number;
    criticalStockItems: number;
    averageDaysUntilStockout: number;
    totalPredictedDemand: number;
    overallRiskScore: number;
  };
  categoryAnalysis: Array<{
    category: string;
    itemCount: number;
    totalCurrentStock: number;
    totalPredictedDemand: number;
    averageRiskLevel: number;
    reorderRecommendations: number;
  }>;
  supplierAnalysis: Array<{
    supplierId: string;
    supplierName: string;
    itemsSupplied: number;
    averageLeadTime: number;
    reliabilityScore: number;
    riskImpact: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>;
  metadata: {
    generatedAt: string;
    forecastPeriod: number;
    confidenceLevel: number;
    modelAccuracy: number;
    dataQuality: number;
  };
}

export interface DemandForecastInput {
  forecastPeriod: number;
  modelType: 'prophet' | 'xgboost' | 'arima' | 'lstm' | 'hybrid' | 'auto';
  itemIds?: string[];
  vendorId?: string;
  categoryFilters?: string[];
  seasonalityType?: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'auto_detect';
  confidenceLevel?: number;
  includeExternalFactors?: boolean;
  historicalWindow?: number;
  modelParameters?: Record<string, any>;
}

export interface DemandForecastResult {
  itemPredictions: Array<{
    itemId: string;
    itemName: string;
    category: string;
    predictions: Array<{
      date: string;
      predictedDemand: number;
      confidenceLower: number;
      confidenceUpper: number;
      trend: number;
      seasonal: number;
    }>;
    metrics: {
      mae: number;
      rmse: number;
      mape: number;
      r2: number;
    };
    insights: {
      trendDirection: 'increasing' | 'decreasing' | 'stable';
      seasonalityStrength: number;
      volatility: 'low' | 'medium' | 'high';
      changepoints: Array<{
        date: string;
        significance: number;
        description: string;
      }>;
    };
  }>;
  aggregatedForecast: {
    totalDemandPrediction: Array<{
      date: string;
      totalDemand: number;
      confidence: number;
    }>;
    peakDemandPeriods: Array<{
      startDate: string;
      endDate: string;
      peakValue: number;
      description: string;
    }>;
    lowDemandPeriods: Array<{
      startDate: string;
      endDate: string;
      lowValue: number;
      description: string;
    }>;
  };
  categoryAnalysis: Array<{
    category: string;
    totalPredictedDemand: number;
    growthRate: number;
    seasonalPattern: string;
    riskLevel: 'low' | 'medium' | 'high';
    topItems: Array<{
      itemId: string;
      itemName: string;
      predictedDemand: number;
    }>;
  }>;
  modelPerformance: {
    selectedModel: string;
    overallAccuracy: number;
    modelComparison: Array<{
      model: string;
      accuracy: number;
      trainingTime: number;
      recommended: boolean;
    }>;
    dataQuality: {
      completeness: number;
      consistency: number;
      outliers: number;
      recommendations: string[];
    };
  };
  businessInsights: {
    keyFindings: string[];
    actionableRecommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      recommendation: string;
      expectedImpact: string;
      timeframe: string;
    }>;
    riskFactors: Array<{
      factor: string;
      impact: 'high' | 'medium' | 'low';
      mitigation: string;
    }>;
  };
  metadata: {
    generatedAt: string;
    forecastPeriod: number;
    modelUsed: string;
    dataPoints: number;
    processingTime: number;
    nextUpdateRecommended: string;
  };
}

export interface ForecastMetrics {
  mae: number
  mse: number
  rmse: number
  mape: number
}

export interface CostForecast {
  totalBudget: number
  categoryBreakdown: Record<string, number>
  growthRate: number
  seasonalFactors: Record<string, number>
  riskAssessment: RiskAssessment
}

export interface InventoryForecast {
  currentStock: Record<string, number>
  reorderLevels: Record<string, number>
  leadTimes: Record<string, number>
  predictedDemand: Record<string, number>
  stockoutDays: Record<string, number>
  reorderRecommendations: ReorderRecommendation[]
  riskLevels: Record<string, 'low' | 'medium' | 'high'>
  dailyConsumption: Record<string, number>
}

export interface RiskAssessment {
  highRiskItems: string[]
  riskScore: number
  recommendations: string[]
}

export interface ReorderRecommendation {
  itemId: string
  itemName: string
  currentStock: number
  reorderQuantity: number
  reorderDate: string
  urgency: 'low' | 'medium' | 'high'
}

export interface ForecastMetadata {
  mlServiceVersion: string
  processingTime: number
  dataPoints: number
  lastTrainingDate?: string
  modelAccuracy?: number
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  vendorId?: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  channel: NotificationChannel
  title: string
  message: string
  data?: NotificationData
  channels: NotificationChannel[]
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  createdAt: string
  updatedAt: string
}

export enum NotificationType {
  ORDER_STATUS = 'order_status',
  PAYMENT = 'payment',
  INVENTORY = 'inventory',
  FORECAST = 'forecast',
  SYSTEM = 'system',
  VENDOR_APPROVAL = 'vendor_approval',
  SUPPLIER_UPDATE = 'supplier_update',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
}

export interface NotificationData {
  orderId?: string
  paymentId?: string
  forecastId?: string
  supplierId?: string
  amount?: number
  status?: string
  actionUrl?: string
  metadata?: Record<string, any>
}

// Analytics Types
export interface DashboardStats {
  orders: OrderStats
  suppliers: SupplierStats
  forecasts: ForecastStats
  payments: PaymentStats
  notifications: NotificationStats
  summary: DashboardSummary
}

export interface OrderStats {
  totalOrders: number
  totalAmount: number
  avgOrderValue: number
  statusBreakdown: Record<string, number>
}

export interface SupplierStats {
  totalSuppliers: number
  suppliersByCategory: Record<string, number>
  suppliersByStatus: Record<string, number>
}

export interface ForecastStats {
  totalForecasts: number
  forecastsByType: Record<string, number>
  forecastsByStatus: Record<string, number>
  forecastsByModel: Record<string, number>
  avgConfidenceLevel: number
  avgProcessingTime: number
}

export interface PaymentStats {
  totalPayments: number
  totalRevenue: number
  avgPaymentAmount: number
  paymentsByStatus: Record<string, number>
  paymentsByMethod: Record<string, number>
}

export interface NotificationStats {
  totalNotifications: number
  notificationsByType: Record<string, number>
  notificationsByStatus: Record<string, number>
  notificationsByPriority: Record<string, number>
  unreadNotifications: number
}

export interface DashboardSummary {
  totalOrders: number
  totalSuppliers: number
  totalForecasts: number
  totalRevenue: number
  unreadNotifications: number
}

export interface TrendData {
  period: string
  startDate: string
  endDate: string
  orders: TrendMetrics
  payments: TrendMetrics
  forecasts: TrendMetrics
}

export interface TrendMetrics {
  daily: DailyMetric[]
  total: number
  totalAmount?: number
  avgConfidence?: number
}

export interface DailyMetric {
  id: string
  count: number
  totalAmount?: number
  avgConfidence?: number
}

export interface KPIReport {
  orders: KPIMetric
  revenue: KPIMetric
  suppliers: KPIMetric
  forecasts: KPIMetric
}

export interface KPIMetric {
  current: number
  previous: number
  change: number
}

// Common Types
export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  statusCode: number
  error: string
}
