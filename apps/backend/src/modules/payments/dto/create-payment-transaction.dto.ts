import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsEmail,
  IsArray,
  IsBoolean,
  Min,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '../schemas/payment-transaction.schema';

export class BillingAddressDto {
  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  line1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;
}

export class CreatePaymentTransactionDto {
  @ApiProperty({ description: 'Vendor ID' })
  @IsMongoId()
  vendorId: string;

  @ApiPropertyOptional({
    description: 'Subscription ID (if related to subscription)',
  })
  @IsOptional()
  @IsMongoId()
  subscriptionId?: string;

  @ApiProperty({ description: 'Unique transaction ID' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Stripe payment intent ID' })
  @IsString()
  stripePaymentIntentId: string;

  @ApiProperty({ description: 'Payment amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code (e.g., USD, EUR)' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Payment status',
    default: PaymentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentType, description: 'Payment type' })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Receipt URL' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Billing address' })
  @IsOptional()
  @IsObject()
  billingAddress?: BillingAddressDto;

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsOptional()
  @IsObject()
  shippingAddress?: BillingAddressDto;

  @ApiPropertyOptional({ description: 'Invoice ID' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Statement descriptor' })
  @IsOptional()
  @IsString()
  statementDescriptor?: string;

  @ApiPropertyOptional({ description: 'Capture method' })
  @IsOptional()
  @IsString()
  captureMethod?: string;

  @ApiPropertyOptional({ description: 'Confirmation method' })
  @IsOptional()
  @IsString()
  confirmationMethod?: string;

  @ApiPropertyOptional({ description: 'Setup future usage' })
  @IsOptional()
  @IsString()
  setupFutureUsage?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
