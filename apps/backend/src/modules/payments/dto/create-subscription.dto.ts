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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '../schemas/subscription.schema';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Vendor ID' })
  @IsMongoId()
  vendorId: string;

  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'Subscription plan type',
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({
    description: 'Stripe Price ID for the subscription plan',
  })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Stripe Payment Method ID',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    description: 'Subscription status',
    default: SubscriptionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiProperty({ description: 'Stripe customer ID' })
  @IsString()
  stripeCustomerId: string;

  @ApiPropertyOptional({ description: 'Stripe subscription ID' })
  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @ApiPropertyOptional({ description: 'Stripe price ID' })
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @ApiProperty({ description: 'Monthly price amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({ description: 'Currency code (e.g., USD, EUR)' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Trial start date' })
  @IsOptional()
  @IsString()
  trialStartDate?: string;

  @ApiPropertyOptional({ description: 'Trial end date' })
  @IsOptional()
  @IsString()
  trialEndDate?: string;

  @ApiPropertyOptional({ description: 'Current period start date' })
  @IsOptional()
  @IsString()
  currentPeriodStart?: string;

  @ApiPropertyOptional({ description: 'Current period end date' })
  @IsOptional()
  @IsString()
  currentPeriodEnd?: string;

  @ApiPropertyOptional({ description: 'Cancel at period end flag' })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Next billing date' })
  @IsOptional()
  @IsString()
  nextBillingDate?: string;

  @ApiPropertyOptional({ description: 'Features included in this plan' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Auto-renew flag', default: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;
}
