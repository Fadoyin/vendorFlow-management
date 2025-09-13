import { IsEmail, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'john.doe@company.com', 
    description: 'User email address',
    format: 'email'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email: string;

  @ApiProperty({ 
    example: 'SecurePass123!', 
    description: 'User password',
    minLength: 1,
    maxLength: 128
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;
}
