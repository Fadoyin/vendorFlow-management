import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SupplierCategory,
  SupplierStatus,
} from '../../../common/schemas/supplier.schema';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier company name' })
  @IsString()
  supplierName: string;

  @ApiProperty({ description: 'Unique supplier code' })
  @IsString()
  supplierCode: string;

  @ApiProperty({ enum: SupplierCategory, description: 'Supplier category' })
  @IsEnum(SupplierCategory)
  category: SupplierCategory;

  @ApiPropertyOptional({
    enum: SupplierStatus,
    description: 'Supplier status',
    default: SupplierStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @ApiPropertyOptional({ description: 'Supplier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Supplier website' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Supplier phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Supplier email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Supplier address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Supplier city' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Supplier state/province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Supplier zip/postal code' })
  @IsString()
  zipCode: string;

  @ApiProperty({ description: 'Supplier country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Primary contact person' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Contact email address' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Tax identification number' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Business license number' })
  @IsOptional()
  @IsString()
  businessLicense?: string;

  @ApiPropertyOptional({ description: 'Insurance information' })
  @IsOptional()
  @IsString()
  insuranceInfo?: string;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Credit limit amount' })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Supplier rating (1-5)' })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ description: 'Lead time in days' })
  @IsOptional()
  @IsNumber()
  leadTime?: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity' })
  @IsOptional()
  @IsNumber()
  minimumOrder?: number;

  @ApiPropertyOptional({ description: 'Delivery area' })
  @IsOptional()
  @IsString()
  deliveryArea?: string;

  @ApiPropertyOptional({ description: 'Certifications array' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Quality rating (1-5)' })
  @IsOptional()
  @IsNumber()
  qualityRating?: number;

  @ApiPropertyOptional({ description: 'Reliability score (1-5)' })
  @IsOptional()
  @IsNumber()
  reliabilityScore?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Is supplier active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
