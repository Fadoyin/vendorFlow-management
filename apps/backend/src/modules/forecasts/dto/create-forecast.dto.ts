import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDateString,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ForecastPeriodDto {
  @ApiProperty({ description: 'Period start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Period end date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Predicted value for this period' })
  @IsNumber()
  @Min(0)
  predictedValue: number;

  @ApiPropertyOptional({ description: 'Lower confidence bound' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowerBound?: number;

  @ApiPropertyOptional({ description: 'Upper confidence bound' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  upperBound?: number;

  @ApiPropertyOptional({ description: 'Confidence level' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Min(1)
  confidenceLevel?: number;
}

export class ForecastMetricsDto {
  @ApiPropertyOptional({ description: 'Mean Absolute Error' })
  @IsOptional()
  @IsNumber()
  mae?: number;

  @ApiPropertyOptional({ description: 'Root Mean Square Error' })
  @IsOptional()
  @IsNumber()
  rmse?: number;

  @ApiPropertyOptional({ description: 'Mean Absolute Percentage Error' })
  @IsOptional()
  @IsNumber()
  mape?: number;

  @ApiPropertyOptional({ description: 'R-squared value' })
  @IsOptional()
  @IsNumber()
  r2?: number;

  @ApiPropertyOptional({ description: 'Training accuracy' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Min(1)
  trainingAccuracy?: number;

  @ApiPropertyOptional({ description: 'Validation accuracy' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Min(1)
  validationAccuracy?: number;
}

export class ForecastParametersDto {
  @ApiProperty({ description: 'Forecast horizon in periods' })
  @IsNumber()
  @Min(1)
  horizon: number;

  @ApiProperty({ description: 'Training window size' })
  @IsNumber()
  @Min(1)
  trainingWindow: number;

  @ApiPropertyOptional({ description: 'Seasonality period' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  seasonality?: number;

  @ApiPropertyOptional({
    description: 'Trend type',
    enum: ['linear', 'exponential', 'polynomial', 'none'],
  })
  @IsOptional()
  @IsEnum(['linear', 'exponential', 'polynomial', 'none'])
  trendType?: string;

  @ApiPropertyOptional({ description: 'Confidence level for intervals' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Min(0.99)
  confidenceLevel?: number;

  @ApiPropertyOptional({ description: 'Model-specific parameters' })
  @IsOptional()
  modelParams?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Feature engineering settings' })
  @IsOptional()
  featureEngineering?: Record<string, any>;
}

export class CreateForecastDto {
  @ApiProperty({
    description: 'Forecast type',
    enum: ['demand', 'cost', 'supply', 'seasonal'],
  })
  @IsEnum(['demand', 'cost', 'supply', 'seasonal'])
  type: string;

  @ApiPropertyOptional({ description: 'Item ID for item-specific forecast' })
  @IsOptional()
  @IsMongoId()
  itemId?: string;

  @ApiPropertyOptional({ description: 'Item SKU' })
  @IsOptional()
  @IsString()
  itemSku?: string;

  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({
    description: 'Vendor ID for vendor-specific forecast',
  })
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiProperty({ description: 'Forecast date' })
  @IsDateString()
  forecastDate: string;

  @ApiProperty({ description: 'Valid from date' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid to date' })
  @IsDateString()
  validTo: string;

  @ApiProperty({ description: 'Forecast periods' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForecastPeriodDto)
  periods: ForecastPeriodDto[];

  @ApiPropertyOptional({ description: 'Forecast metrics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ForecastMetricsDto)
  metrics?: ForecastMetricsDto;

  @ApiProperty({ description: 'Forecast parameters' })
  @ValidateNested()
  @Type(() => ForecastParametersDto)
  parameters: ForecastParametersDto;

  @ApiPropertyOptional({ description: 'Model version' })
  @IsOptional()
  @IsString()
  modelVersion?: string;

  @ApiPropertyOptional({ description: 'Training data hash' })
  @IsOptional()
  @IsString()
  trainingDataHash?: string;

  @ApiPropertyOptional({ description: 'Last training date' })
  @IsOptional()
  @IsDateString()
  lastTrainingDate?: string;

  @ApiPropertyOptional({ description: 'Next training date' })
  @IsOptional()
  @IsDateString()
  nextTrainingDate?: string;

  @ApiPropertyOptional({ description: 'Training duration in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trainingDuration?: number;

  @ApiPropertyOptional({ description: 'Training status' })
  @IsOptional()
  @IsString()
  trainingStatus?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether forecast is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
