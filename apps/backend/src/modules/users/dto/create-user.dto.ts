import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  Matches,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  SUPPLIER = 'supplier',
}

export enum UserPermission {
  READ_VENDORS = 'read:vendors',
  WRITE_VENDORS = 'write:vendors',
  READ_INVENTORY = 'read:inventory',
  WRITE_INVENTORY = 'write:inventory',
  READ_PURCHASE_ORDERS = 'read:purchase_orders',
  WRITE_PURCHASE_ORDERS = 'write:purchase_orders',
  APPROVE_PURCHASE_ORDERS = 'approve:purchase_orders',
  READ_FORECASTS = 'read:forecasts',
  WRITE_FORECASTS = 'write:forecasts',
  MANAGE_USERS = 'manage:users',
  MANAGE_TENANT = 'manage:tenant',
}

export class CreateUserDto {
  @ApiProperty({ description: 'User first name' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'User job title' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Business type' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Company website' })
  @IsOptional()
  @ValidateIf((o) => o.website && o.website.trim() !== '')
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State or province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP or postal code' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'User permissions',
    enum: UserPermission,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(UserPermission, { each: true })
  permissions?: UserPermission[];

  @ApiPropertyOptional({ description: 'Whether user is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
