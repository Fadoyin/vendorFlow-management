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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderPriority } from '../../../common/schemas/order.schema';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ description: 'Item ID' })
  @IsOptional()
  @IsMongoId()
  itemId?: string;

  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ description: 'Item SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Quantity ordered', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Item notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Unique order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Vendor ID' })
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsMongoId()
  supplierId?: string;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: OrderPriority, description: 'Order priority' })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({ description: 'Order date' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({
    description: 'Order items',
    type: [UpdateOrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items?: UpdateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Shipping cost', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({ description: 'Discount amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Currency' })
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

  @ApiPropertyOptional({ description: 'Is urgent order' })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Requires approval' })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Order tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Calculated fields that can be updated
  @ApiPropertyOptional({ description: 'Subtotal amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;
}
