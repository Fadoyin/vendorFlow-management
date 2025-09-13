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
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CostForecastModelType {
  LINEAR = 'linear',
  POLYNOMIAL = 'polynomial',
  EXPONENTIAL = 'exponential',
  SEASONAL = 'seasonal',
  HYBRID = 'hybrid',
}

export class CostForecastInputDto {
  @ApiProperty({ description: 'Number of months to forecast', minimum: 1, maximum: 24 })
  @IsNumber()
  @Min(1)
  @Max(24)
  forecastMonths: number;

  @ApiProperty({ description: 'Model type for cost forecasting', enum: CostForecastModelType })
  @IsEnum(CostForecastModelType)
  modelType: CostForecastModelType;

  @ApiProperty({ description: 'Base monthly budget', minimum: 0 })
  @IsNumber()
  @Min(0)
  baseMonthlyBudget: number;

  @ApiPropertyOptional({ description: 'Specific vendor ID for vendor-specific forecast' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Include seasonal factors in calculation', default: true })
  @IsOptional()
  includeSeasonalFactors?: boolean;

  @ApiPropertyOptional({ description: 'Risk assessment level (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  riskLevel?: number;

  @ApiPropertyOptional({ description: 'Category filters for cost breakdown' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryFilters?: string[];
}

export class CostForecastResultDto {
  @ApiProperty({ description: 'Total monthly cost predictions' })
  monthlyPredictions: Array<{
    month: string;
    totalCost: number;
    confidence: number;
    growthRate: number;
  }>;

  @ApiProperty({ description: 'Category breakdown' })
  categoryBreakdown: Array<{
    category: string;
    currentCost: number;
    predictedCost: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  @ApiProperty({ description: 'Overall growth rate percentage' })
  overallGrowthRate: number;

  @ApiProperty({ description: 'Seasonal factors detected' })
  seasonalFactors: Array<{
    period: string;
    factor: number;
    description: string;
  }>;

  @ApiProperty({ description: 'Risk assessment' })
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
    recommendations: string[];
  };

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalForecastValue: number;
    averageMonthlyCost: number;
    peakMonth: string;
    lowestMonth: string;
    confidenceScore: number;
  };
} 