import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsMongoId,
  Min,
  Max,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DemandForecastModel {
  PROPHET = 'prophet',
  XGBOOST = 'xgboost',
  ARIMA = 'arima',
  LSTM = 'lstm',
  HYBRID = 'hybrid',
  AUTO = 'auto',
}

export enum SeasonalityType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  AUTO_DETECT = 'auto_detect',
}

export class DemandForecastInputDto {
  @ApiProperty({ description: 'Forecast period in days', minimum: 7, maximum: 365 })
  @IsNumber()
  @Min(7)
  @Max(365)
  forecastPeriod: number;

  @ApiProperty({ description: 'Model type for demand forecasting', enum: DemandForecastModel })
  @IsEnum(DemandForecastModel)
  modelType: DemandForecastModel;

  @ApiPropertyOptional({ description: 'Specific item IDs to forecast' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];

  @ApiPropertyOptional({ description: 'Specific vendor ID for vendor-specific forecast' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Timestamp for cache busting' })
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @ApiPropertyOptional({ description: 'Category filters' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryFilters?: string[];

  @ApiPropertyOptional({ description: 'Seasonality type to consider', enum: SeasonalityType })
  @IsOptional()
  @IsEnum(SeasonalityType)
  seasonalityType?: SeasonalityType;

  @ApiPropertyOptional({ description: 'Confidence level for predictions', minimum: 0.8, maximum: 0.99 })
  @IsOptional()
  @IsNumber()
  @Min(0.8)
  @Max(0.99)
  confidenceLevel?: number;

  @ApiPropertyOptional({ description: 'Include external factors (weather, events, etc.)' })
  @IsOptional()
  @IsBoolean()
  includeExternalFactors?: boolean;

  @ApiPropertyOptional({ description: 'Historical data window in days', minimum: 30, maximum: 730 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(730)
  historicalWindow?: number;

  @ApiPropertyOptional({ description: 'Advanced model parameters' })
  @IsOptional()
  @IsObject()
  modelParameters?: {
    // Prophet specific
    changepoint_prior_scale?: number;
    seasonality_prior_scale?: number;
    holidays_prior_scale?: number;
    
    // XGBoost specific
    max_depth?: number;
    learning_rate?: number;
    n_estimators?: number;
    
    // ARIMA specific
    p?: number;
    d?: number;
    q?: number;
    
    // General parameters
    cross_validation_folds?: number;
    feature_selection?: boolean;
  };
}

export class DemandForecastResultDto {
  @ApiProperty({ description: 'Item-specific demand predictions' })
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

  @ApiProperty({ description: 'Aggregated demand forecast' })
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

  @ApiProperty({ description: 'Category-wise analysis' })
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

  @ApiProperty({ description: 'Model performance and recommendations' })
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

  @ApiProperty({ description: 'Business insights and recommendations' })
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

  @ApiProperty({ description: 'Forecast metadata' })
  metadata: {
    generatedAt: string;
    forecastPeriod: number;
    modelUsed: string;
    dataPoints: number;
    processingTime: number;
    nextUpdateRecommended: string;
  };
} 