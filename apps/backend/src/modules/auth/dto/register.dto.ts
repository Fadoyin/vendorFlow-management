import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/schemas/user.schema';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@company.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email: string;

  @ApiProperty({ 
    example: 'test123', 
    description: 'Password must be at least 6 characters long',
    minLength: 6,
    maxLength: 128
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, hyphens, and apostrophes' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' })
  lastName: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'Company name' })
  @IsString({ message: 'Company name must be a string' })
  @IsNotEmpty({ message: 'Company name is required' })
  @MinLength(1, { message: 'Company name cannot be empty' })
  @MaxLength(100, { message: 'Company name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  companyName: string;

  @ApiProperty({ 
    example: 'vendor', 
    description: 'User role',
    enum: UserRole,
    enumName: 'UserRole'
  })
  @IsEnum(UserRole, { message: 'Role must be one of: admin, vendor, supplier' })
  role: UserRole;

  @ApiPropertyOptional({ 
    example: 'COMPANY123', 
    description: 'Optional invite code to join existing company/tenant'
  })
  @IsOptional()
  @IsString({ message: 'Invite code must be a string' })
  @MaxLength(50, { message: 'Invite code must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim()?.toUpperCase())
  inviteCode?: string;
}
