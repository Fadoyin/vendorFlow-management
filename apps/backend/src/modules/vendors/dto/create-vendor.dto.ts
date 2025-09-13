import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VendorAddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'ZIP/Postal code' })
  @IsString()
  zipCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Additional address information' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

export class VendorContactDto {
  @ApiProperty({ description: 'Contact person name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact job title' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary contact' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateVendorDto {
  @ApiProperty({ description: 'Vendor name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique vendor code' })
  @IsString()
  vendorCode: string;

  @ApiProperty({
    description: 'Vendor category',
    enum: [
      'raw_materials',
      'packaging',
      'equipment',
      'services',
      'logistics',
      'other',
    ],
  })
  @IsEnum([
    'raw_materials',
    'packaging',
    'equipment',
    'services',
    'logistics',
    'other',
  ])
  category: string;

  @ApiPropertyOptional({ description: 'Vendor description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Vendor website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Vendor logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ description: 'Vendor address' })
  @ValidateNested()
  @Type(() => VendorAddressDto)
  address: VendorAddressDto;

  @ApiProperty({ description: 'Vendor contacts', type: [VendorContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorContactDto)
  contacts: VendorContactDto[];

  @ApiPropertyOptional({
    description: 'Payment terms',
    enum: ['net_30', 'net_60', 'net_90', 'immediate', 'custom'],
  })
  @IsOptional()
  @IsEnum(['net_30', 'net_60', 'net_90', 'immediate', 'custom'])
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Credit limit' })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Registration number' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Date when vendor was established' })
  @IsOptional()
  @IsDateString()
  establishedDate?: string;

  @ApiPropertyOptional({ description: 'Vendor certifications', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Vendor capabilities', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  customFields?: Record<string, any>;
}
