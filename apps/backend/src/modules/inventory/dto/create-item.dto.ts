import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

// Simplified DTO for testing - no nested objects
export class CreateItemDto {
  @ApiProperty({ description: 'Item SKU' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Item category',
    enum: [
      'raw_materials',
      'finished_goods',
      'work_in_progress',
      'packaging',
      'supplies',
      'equipment',
      'other',
    ],
  })
  @IsEnum([
    'raw_materials',
    'finished_goods',
    'work_in_progress',
    'packaging',
    'supplies',
    'equipment',
    'other',
  ])
  category: string;

  @ApiProperty({ description: 'Unit of measure' })
  @IsEnum([
    'piece',
    'kg',
    'l',
    'm',
    'box',
    'pack',
    'roll',
    'set',
    'pair',
    'dozen',
    'hundred',
    'thousand',
  ])
  unitOfMeasure: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Model number' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Country of origin' })
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @ApiPropertyOptional({ description: 'Barcode' })
  @IsOptional()
  @IsString()
  barcode?: string;

  // Flattened pricing fields
  @ApiProperty({ description: 'Cost price' })
  @IsNumber()
  costPrice: number;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  // Flattened inventory fields
  @ApiProperty({ description: 'Current stock level' })
  @IsNumber()
  currentStock: number;

  @ApiPropertyOptional({ description: 'Reorder point' })
  @IsOptional()
  @IsNumber()
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity' })
  @IsOptional()
  @IsNumber()
  reorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Stock unit' })
  @IsOptional()
  @IsString()
  stockUnit?: string;

  @ApiPropertyOptional({ description: 'Serial number tracking' })
  @IsOptional()
  @IsBoolean()
  isSerialized?: boolean;

  @ApiPropertyOptional({ description: 'Lot tracking' })
  @IsOptional()
  @IsBoolean()
  isLotTracked?: boolean;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
