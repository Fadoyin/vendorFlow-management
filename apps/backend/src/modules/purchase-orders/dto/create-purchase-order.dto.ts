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

export class PurchaseOrderItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsMongoId()
  itemId: string;

  @ApiProperty({ description: 'Item SKU' })
  @IsString()
  itemSku: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  itemName: string;

  @ApiProperty({ description: 'Quantity ordered' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Tax percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercentage?: number;

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;
}

export class PurchaseOrderApprovalDto {
  @ApiProperty({ description: 'Approver ID' })
  @IsMongoId()
  approverId: string;

  @ApiProperty({ description: 'Approver name' })
  @IsString()
  approverName: string;

  @ApiProperty({ description: 'Approval level' })
  @IsNumber()
  @Min(1)
  level: number;

  @ApiPropertyOptional({
    description: 'Approval status',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  status?: string;

  @ApiPropertyOptional({ description: 'Approval date' })
  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  @ApiPropertyOptional({ description: 'Comments' })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Purchase order number' })
  @IsString()
  poNumber: string;

  @ApiProperty({
    description: 'Purchase order type',
    enum: ['regular', 'blanket', 'contract', 'emergency'],
  })
  @IsEnum(['regular', 'blanket', 'contract', 'emergency'])
  type: string;

  @ApiProperty({ description: 'Vendor ID' })
  @IsMongoId()
  vendorId: string;

  @ApiProperty({ description: 'Vendor name' })
  @IsString()
  vendorName: string;

  @ApiPropertyOptional({ description: 'Vendor code' })
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiProperty({ description: 'Requester ID' })
  @IsMongoId()
  requesterId: string;

  @ApiProperty({ description: 'Requester name' })
  @IsString()
  requesterName: string;

  @ApiPropertyOptional({ description: 'Buyer ID' })
  @IsOptional()
  @IsMongoId()
  buyerId?: string;

  @ApiPropertyOptional({ description: 'Buyer name' })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiProperty({ description: 'Order date' })
  @IsDateString()
  orderDate: string;

  @ApiProperty({ description: 'Expected delivery date' })
  @IsDateString()
  expectedDeliveryDate: string;

  @ApiProperty({ description: 'Order items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Payment due date' })
  @IsOptional()
  @IsDateString()
  paymentDueDate?: string;

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'Billing address' })
  @IsOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether order is urgent' })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Approval workflow' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderApprovalDto)
  approvals?: PurchaseOrderApprovalDto[];
}
