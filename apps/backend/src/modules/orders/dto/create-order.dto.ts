import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsBoolean,
  ValidateNested,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderPriority } from '../../../common/schemas/order.schema';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsMongoId()
  itemId: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  itemName: string;

  @ApiProperty({ description: 'Item SKU' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Quantity ordered', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Item notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Unique order ID' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ description: 'Vendor ID (auto-populated from auth context if not provided)' })
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @ApiProperty({ description: 'Supplier ID' })
  @IsMongoId()
  supplierId: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Order status',
    default: OrderStatus.PLACED,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: OrderPriority,
    description: 'Order priority',
    default: OrderPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiProperty({ description: 'Order date' })
  @IsDateString()
  orderDate: string;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Shipping cost', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({
    description: 'Discount amount',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'Billing address' })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Supplier notes' })
  @IsOptional()
  @IsString()
  supplierNotes?: string;

  @ApiPropertyOptional({ description: 'Estimated shipping days' })
  @IsOptional()
  @IsNumber()
  estimatedShippingDays?: number;

  @ApiPropertyOptional({ description: 'Is urgent order', default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Requires approval', default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Order tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
