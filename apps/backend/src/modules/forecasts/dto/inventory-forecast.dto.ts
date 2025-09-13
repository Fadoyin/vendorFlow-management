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
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Current stock level' })
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty({ description: 'Reorder level threshold' })
  @IsNumber()
  @Min(0)
  reorderLevel: number;

  @ApiProperty({ description: 'Lead time in days' })
  @IsNumber()
  @Min(1)
  leadTime: number;

  @ApiProperty({ description: 'Item category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Supplier information' })
  @IsOptional()
  @IsObject()
  supplierInfo?: {
    supplierId: string;
    supplierName: string;
    reliability: number; // 1-5 scale
    averageDeliveryTime: number;
  };

  @ApiPropertyOptional({ description: 'Unit cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQuantity?: number;
}

export class InventoryForecastInputDto {
  @ApiProperty({ description: 'Inventory items to forecast' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  inventoryItems: InventoryItemDto[];

  @ApiProperty({ description: 'Forecast period in days', minimum: 7, maximum: 365 })
  @IsNumber()
  @Min(7)
  @Max(365)
  forecastPeriod: number;

  @ApiPropertyOptional({ description: 'Specific vendor ID for vendor-specific forecast' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Timestamp for cache busting' })
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @ApiPropertyOptional({ description: 'Include seasonal demand patterns', default: true })
  @IsOptional()
  includeSeasonality?: boolean;

  @ApiPropertyOptional({ description: 'Safety stock multiplier', minimum: 1, maximum: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  safetyStockMultiplier?: number;

  @ApiPropertyOptional({ description: 'Category filters' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryFilters?: string[];
}

export class InventoryForecastResultDto {
  @ApiProperty({ description: 'Item-specific forecasts' })
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

  @ApiProperty({ description: 'Overall inventory summary' })
  summary: {
    totalItems: number;
    itemsRequiringReorder: number;
    criticalStockItems: number;
    averageDaysUntilStockout: number;
    totalPredictedDemand: number;
    overallRiskScore: number;
  };

  @ApiProperty({ description: 'Category analysis' })
  categoryAnalysis: Array<{
    category: string;
    itemCount: number;
    totalCurrentStock: number;
    totalPredictedDemand: number;
    averageRiskLevel: number;
    reorderRecommendations: number;
  }>;

  @ApiProperty({ description: 'Supplier performance impact' })
  supplierAnalysis: Array<{
    supplierId: string;
    supplierName: string;
    itemsSupplied: number;
    averageLeadTime: number;
    reliabilityScore: number;
    riskImpact: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>;

  @ApiProperty({ description: 'Forecast metadata' })
  metadata: {
    generatedAt: string;
    forecastPeriod: number;
    confidenceLevel: number;
    modelAccuracy: number;
    dataQuality: number;
  };
} 