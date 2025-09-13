import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument, BaseSchema } from './base.schema';

export enum ForecastType {
  DEMAND = 'demand',
  COST = 'cost',
  SUPPLY = 'supply',
  SEASONAL = 'seasonal',
}

export enum ForecastModel {
  PROPHET = 'prophet',
  XGBOOST = 'xgboost',
  LINEAR_REGRESSION = 'linear_regression',
  ARIMA = 'arima',
  LSTM = 'lstm',
}

export enum ForecastStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum ForecastAccuracy {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Schema({ timestamps: true })
export class ForecastPeriod {
  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, min: 0 })
  predictedValue: number;

  @Prop({ type: Number, min: 0 })
  lowerBound: number;

  @Prop({ type: Number, min: 0 })
  upperBound: number;

  @Prop({ type: Number, min: 0 })
  confidence: number;

  @Prop({ type: Number, min: 0 })
  actualValue: number;

  @Prop({ type: Number, min: 0 })
  accuracy: number;

  @Prop({ type: String, trim: true })
  notes: string;
}

@Schema({ timestamps: true })
export class ForecastMetrics {
  @Prop({ type: Number, min: 0 })
  mape: number; // Mean Absolute Percentage Error

  @Prop({ type: Number, min: 0 })
  rmse: number; // Root Mean Square Error

  @Prop({ type: Number, min: 0 })
  mae: number; // Mean Absolute Error

  @Prop({ type: Number, min: 0 })
  r2: number; // R-squared

  @Prop({ type: Number, min: 0 })
  overallAccuracy: number;

  @Prop({ type: String, enum: ForecastAccuracy })
  accuracyRating: ForecastAccuracy;

  @Prop({ type: Number, min: 0 })
  confidenceInterval: number;
}

@Schema({ timestamps: true })
export class ForecastParameters {
  @Prop({ type: String, enum: ForecastModel, required: true })
  model: ForecastModel;

  @Prop({ type: Number, min: 1 })
  forecastHorizon: number;

  @Prop({ type: String, trim: true })
  horizonUnit: string;

  @Prop({ type: Number, min: 1 })
  trainingWindow: number;

  @Prop({ type: String, trim: true })
  trainingWindowUnit: string;

  @Prop({ type: Number, min: 0, max: 1 })
  confidenceLevel: number;

  @Prop({ type: Object })
  hyperparameters: Record<string, any>;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: Object })
  seasonality: Record<string, any>;

  @Prop({ type: Object })
  customSettings: Record<string, any>;
}

@Schema({ timestamps: true })
export class Forecast extends BaseDocument {
  @Prop({ required: true, trim: true })
  forecastId: string;

  @Prop({ type: String, enum: ForecastType, required: true })
  type: ForecastType;

  @Prop({ type: Types.ObjectId, ref: 'Item' })
  itemId: Types.ObjectId;

  @Prop({ type: String, trim: true })
  itemSku: string;

  @Prop({ type: String, trim: true })
  itemName: string;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId: Types.ObjectId;

  @Prop({ type: String, trim: true })
  vendorName: string;

  @Prop({ type: String, enum: ForecastStatus, default: ForecastStatus.PENDING })
  status: ForecastStatus;

  @Prop({ type: Date, required: true })
  forecastDate: Date;

  @Prop({ type: Date, required: true })
  validFrom: Date;

  @Prop({ type: Date, required: true })
  validTo: Date;

  @Prop({ type: [ForecastPeriod], required: true })
  periods: ForecastPeriod[];

  @Prop({ type: ForecastMetrics })
  metrics: ForecastMetrics;

  @Prop({ type: ForecastParameters, required: true })
  parameters: ForecastParameters;

  @Prop({ type: Number, min: 0 })
  totalPredictedValue: number;

  @Prop({ type: Number, min: 0 })
  averagePredictedValue: number;

  @Prop({ type: Number, min: 0 })
  minPredictedValue: number;

  @Prop({ type: Number, min: 0 })
  maxPredictedValue: number;

  @Prop({ type: String, trim: true })
  modelVersion: string;

  @Prop({ type: String, trim: true })
  trainingDataHash: string;

  @Prop({ type: Date })
  lastTrainingDate: Date;

  @Prop({ type: Date })
  nextTrainingDate: Date;

  @Prop({ type: Number, min: 0 })
  trainingDuration: number;

  @Prop({ type: String, trim: true })
  trainingStatus: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, trim: true })
  notes: string;

  @Prop({ type: Object })
  customFields: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: Date })
  activatedAt: Date;

  @Prop({ type: Date })
  deactivatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  activatedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deactivatedBy: Types.ObjectId;

  @Prop({ type: String, trim: true })
  failureReason: string;

  @Prop({ type: Number, min: 0 })
  retryCount: number;

  @Prop({ type: Date })
  lastRetryAt: Date;
}

export const ForecastSchema = SchemaFactory.createForClass(Forecast);

// Add base schema fields
ForecastSchema.add(BaseSchema);

// Indexes
ForecastSchema.index({ forecastId: 1 });
ForecastSchema.index({ tenantId: 1, forecastId: 1 });
ForecastSchema.index({ tenantId: 1, type: 1 });
ForecastSchema.index({ tenantId: 1, itemId: 1 });
ForecastSchema.index({ tenantId: 1, vendorId: 1 });
ForecastSchema.index({ tenantId: 1, status: 1 });
ForecastSchema.index({ tenantId: 1, forecastDate: -1 });
ForecastSchema.index({ tenantId: 1, validFrom: 1 });
ForecastSchema.index({ tenantId: 1, validTo: 1 });
ForecastSchema.index({ 'parameters.model': 1 });
ForecastSchema.index({ isActive: 1 });

// Virtual for forecast range
ForecastSchema.virtual('forecastRange').get(function () {
  return `${this.validFrom.toISOString().split('T')[0]} to ${this.validTo.toISOString().split('T')[0]}`;
});

// Virtual for period count
ForecastSchema.virtual('periodCount').get(function () {
  return this.periods.length;
});

// Virtual for is expired
ForecastSchema.virtual('isExpired').get(function () {
  return new Date() > this.validTo;
});

// Virtual for days until expiry
ForecastSchema.virtual('daysUntilExpiry').get(function () {
  const now = new Date();
  const expiry = this.validTo;
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
ForecastSchema.set('toJSON', { virtuals: true });
ForecastSchema.set('toObject', { virtuals: true });
